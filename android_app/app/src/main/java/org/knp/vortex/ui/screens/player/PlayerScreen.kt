package org.knp.vortex.ui.screens.player

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.animation.*
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.material3.Icon
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BrightnessMedium
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.knp.vortex.data.repository.MediaRepository
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.utils.findActivity

// Note: In a real app, inject Repo via ViewModel. Using direct logic here for brevity if simple service.
// But better to use ViewModel. 

// Quick ViewModel for Player

import org.knp.vortex.data.repository.SettingsRepository
import okhttp3.Call
import okhttp3.OkHttpClient

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: SettingsRepository,
    private val okHttpClient: OkHttpClient
) : ViewModel() {
    
    val callFactory: Call.Factory get() = okHttpClient
    
    fun getServerUrl(): String = settingsRepository.getServerUrl()
    fun getToken(): String? = settingsRepository.getAuthToken()
    fun getProgress(id: Long, onResult: (Long) -> Unit) {
        viewModelScope.launch {
            repository.getProgress(id).onSuccess { 
                onResult(it.position) 
            }.onFailure {
                onResult(0L)
            }
        }
    }

    fun getPlayerSettings(onResult: (org.json.JSONObject?) -> Unit) {
        viewModelScope.launch {
            repository.getSettings().onSuccess { settingsList ->
                val pSettings = settingsList.find { it.key == "player_settings" }
                if (pSettings != null) {
                    try {
                        onResult(org.json.JSONObject(pSettings.value))
                    } catch (e: Exception) {
                        onResult(null)
                    }
                } else {
                    onResult(null)
                }
            }.onFailure {
                onResult(null)
            }
        }
    }

    fun getSubtitles(id: Long, onResult: (List<org.knp.vortex.data.remote.SubtitleTrackDto>) -> Unit) {
        viewModelScope.launch {
            repository.getSubtitles(id).onSuccess { 
                onResult(it) 
            }
        }
    }

    fun saveProgress(id: Long, position: Long, total: Long) {
        viewModelScope.launch {
             // Simple throttling could be added here
            repository.updateProgress(id, position, total)
        }
    }

    fun handleConnectionError() {
        settingsRepository.setAuthToken(null)
    }
}

enum class ScalingMode(val displayName: String) {
    BEST_FIT("Best Fit"),
    FIT_TO_SCREEN("Fit to Screen"),
    FILL("Fill"),
    CENTER("Center")
}

// Need to pass VM via Hilt


@Composable
fun PlayerScreen(
    mediaId: Long,
    onBack: () -> Unit,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var savedPosition by remember { mutableStateOf(0L) }
    var isReady by remember { mutableStateOf(false) }
    var subtitles by remember { mutableStateOf<List<org.knp.vortex.data.remote.SubtitleTrackDto>>(emptyList()) }
    var subtitlesLoaded by remember { mutableStateOf(false) }
    var progressLoaded by remember { mutableStateOf(false) }
    var scalingMode by remember { mutableStateOf(ScalingMode.BEST_FIT) }
    var playerSettingsLoaded by remember { mutableStateOf(false) }
    var skipForwardMs by remember { mutableStateOf(10000L) }
    var skipBackwardMs by remember { mutableStateOf(10000L) }
    var videoSize by remember { mutableStateOf<androidx.media3.common.VideoSize?>(null) }
    var showBrightnessIndicator by remember { mutableStateOf(false) }
    var brightnessLevel by remember { mutableStateOf(0f) }
    var showVolumeIndicator by remember { mutableStateOf(false) }
    var volumeLevel by remember { mutableStateOf(0f) }

    LaunchedEffect(brightnessLevel, showBrightnessIndicator) {
        if (showBrightnessIndicator) {
            delay(1500)
            showBrightnessIndicator = false
        }
    }

    LaunchedEffect(volumeLevel, showVolumeIndicator) {
        if (showVolumeIndicator) {
            delay(1500)
            showVolumeIndicator = false
        }
    }

    LaunchedEffect(mediaId) {
        viewModel.getPlayerSettings { json ->
            if (json != null) {
                skipForwardMs = json.optInt("skipForwardTime", 10) * 1000L
                skipBackwardMs = json.optInt("skipBackwardTime", 10) * 1000L
            }
            playerSettingsLoaded = true
            if (progressLoaded && subtitlesLoaded) isReady = true
        }
        viewModel.getSubtitles(mediaId) { subs ->
            subtitles = subs
            subtitlesLoaded = true
            if (progressLoaded && playerSettingsLoaded) isReady = true
        }
        viewModel.getProgress(mediaId) { pos ->
            savedPosition = pos
            progressLoaded = true
            if (subtitlesLoaded && playerSettingsLoaded) isReady = true
        }
    }

    if (!isReady) {
        Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
            Text("Loading...", color = Color.White)
        }
        return
    }

    var errorMessage by remember { mutableStateOf<String?>(null) }

    val exoPlayer = remember {
        val dataSourceFactory = androidx.media3.datasource.DefaultDataSource.Factory(
            context,
            androidx.media3.datasource.okhttp.OkHttpDataSource.Factory(viewModel.callFactory)
        )
        
        ExoPlayer.Builder(context)
            .setMediaSourceFactory(
                androidx.media3.exoplayer.source.DefaultMediaSourceFactory(dataSourceFactory)
            )
            .setSeekForwardIncrementMs(skipForwardMs)
            .setSeekBackIncrementMs(skipBackwardMs)
            .build()
            .apply {
                // Dynamic Media URL from Settings
                val baseUrl = viewModel.getServerUrl().trimEnd('/')
                val token = viewModel.getToken()
                val tokenQuery = if (token != null) "?token=$token" else ""
                val mediaUrl = "$baseUrl/api/v1/stream/$mediaId$tokenQuery"
                
                val mediaItemBuilder = MediaItem.Builder()
                    .setUri(mediaUrl)
                
                val subtitleConfigs = subtitles.map { sub ->
                    // The vortex-server backend converts all SRT files and embedded subtitles to WebVTT on the fly.
                    val mimeType = androidx.media3.common.MimeTypes.TEXT_VTT
                    val subUrl = "$baseUrl${sub.url}$tokenQuery"
                    MediaItem.SubtitleConfiguration.Builder(android.net.Uri.parse(subUrl))
                        .setMimeType(mimeType)
                        .setLanguage(sub.language)
                        .setLabel(sub.label)
                        .setSelectionFlags(androidx.media3.common.C.SELECTION_FLAG_DEFAULT) 
                        .build()
                }
                
                if (subtitleConfigs.isNotEmpty()) {
                    mediaItemBuilder.setSubtitleConfigurations(subtitleConfigs)
                }

                setMediaItem(mediaItemBuilder.build())
                
                addListener(object : androidx.media3.common.Player.Listener {
                    override fun onVideoSizeChanged(newVideoSize: androidx.media3.common.VideoSize) {
                        videoSize = newVideoSize
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        val cause = error.cause
                        val isNetworkError = cause is androidx.media3.datasource.HttpDataSource.HttpDataSourceException ||
                                error.errorCode == androidx.media3.common.PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED ||
                                error.errorCode == androidx.media3.common.PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT ||
                                error.errorCode == androidx.media3.common.PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS

                        if (isNetworkError) {
                            viewModel.handleConnectionError()
                        } else {
                            errorMessage = "Error: ${error.message}\nCode: ${error.errorCodeName}"
                        }
                    }
                })

                prepare()
                if (savedPosition > 0) seekTo(savedPosition * 1000)
                playWhenReady = true
        }
    }
    
    // Auto-save Progress
    LaunchedEffect(exoPlayer) {
        while(true) {
            delay(5000)
            if (exoPlayer.isPlaying) {
                 // DB expects seconds usually, Exo uses ms
                viewModel.saveProgress(mediaId, exoPlayer.currentPosition / 1000, exoPlayer.duration / 1000)
            }
        }
    }

    // Lifecycle handling
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE) {
                exoPlayer.pause()
                viewModel.saveProgress(mediaId, exoPlayer.currentPosition / 1000, exoPlayer.duration / 1000)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            exoPlayer.release()
        }
    }
    
    // Handle Auto-rotation & Full Screen Mode
    val activity = context.findActivity()
    val window = activity?.window

    DisposableEffect(Unit) {
        if (activity != null && window != null) {
            val controller = androidx.core.view.WindowInsetsControllerCompat(window, window.decorView)
            
            // Allow sensor-based auto rotate (portrait & landscape)
            activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR
            
            // Keep screen on
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Enter Immersive Fullscreen
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
            controller.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        onDispose {
            // Restore default configuration on exit
             if (activity != null && window != null) {
                 activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                 window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                 androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, true)
                 androidx.core.view.WindowInsetsControllerCompat(window, window.decorView).show(androidx.core.view.WindowInsetsCompat.Type.systemBars())
             }
        }
    }

    val density = androidx.compose.ui.platform.LocalDensity.current
    var panOffset by remember { mutableStateOf(0f) }

    LaunchedEffect(scalingMode, videoSize) {
        panOffset = 0f
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .clipToBounds(),
        contentAlignment = Alignment.Center
    ) {
        val containerWidthPx = with(density) { maxWidth.roundToPx() }
        val containerHeightPx = with(density) { maxHeight.roundToPx() }
        val isPortrait = containerHeightPx > containerWidthPx

        val (targetWidthPx, targetHeightPx) = if (videoSize != null && videoSize!!.width > 0 && videoSize!!.height > 0) {
            val videoWidth = videoSize!!.width
            val videoHeight = videoSize!!.height
            val videoAspectRatio = videoWidth.toFloat() / videoHeight.toFloat()
            val containerAspectRatio = containerWidthPx.toFloat() / containerHeightPx.toFloat()

            when (scalingMode) {
                ScalingMode.BEST_FIT -> {
                    if (videoAspectRatio > containerAspectRatio) {
                        Pair(containerWidthPx, (containerWidthPx / videoAspectRatio).toInt())
                    } else {
                        Pair((containerHeightPx * videoAspectRatio).toInt(), containerHeightPx)
                    }
                }
                ScalingMode.FIT_TO_SCREEN -> {
                    Pair(containerWidthPx, containerHeightPx)
                }
                ScalingMode.FILL -> {
                    if (videoAspectRatio > containerAspectRatio) {
                        Pair((containerHeightPx * videoAspectRatio).toInt(), containerHeightPx)
                    } else {
                        Pair(containerWidthPx, (containerWidthPx / videoAspectRatio).toInt())
                    }
                }
                ScalingMode.CENTER -> {
                    Pair(videoWidth, videoHeight)
                }
            }
        } else {
            Pair(containerWidthPx, containerHeightPx)
        }

        val isScrollable = isPortrait && (videoSize != null) && (targetWidthPx > containerWidthPx)
        val maxPan = if (isScrollable) (targetWidthPx - containerWidthPx) / 2f else 0f

        val dragModifier = if (isScrollable) {
            Modifier.pointerInput(maxPan) {
                detectHorizontalDragGestures { change, dragAmount ->
                    change.consume()
                    panOffset = (panOffset + dragAmount).coerceIn(-maxPan, maxPan)
                }
            }
        } else {
            Modifier
        }

        AndroidView(
            factory = {
                PlayerView(context).apply {
                    player = exoPlayer
                    // Enable native subtitle button
                    setShowSubtitleButton(true)
                    // Enable native fullscreen button logic to cycle scaling modes
                    setFullscreenButtonClickListener {
                        scalingMode = when (scalingMode) {
                            ScalingMode.BEST_FIT -> ScalingMode.FILL
                            ScalingMode.FILL -> ScalingMode.CENTER
                            ScalingMode.CENTER -> ScalingMode.BEST_FIT
                            ScalingMode.FIT_TO_SCREEN -> ScalingMode.BEST_FIT
                        }
                    }
                    // Hide controller timeout to allow back button visibility if custom UI
                    controllerShowTimeoutMs = 3000
                    
                    val audioManager = context.getSystemService(android.content.Context.AUDIO_SERVICE) as android.media.AudioManager
                    val gestureDetector = android.view.GestureDetector(context, object : android.view.GestureDetector.SimpleOnGestureListener() {
                        var startY = 0f
                        var startBrightness = 0f
                        var startVolume = 0
                        var isLeftEdge = false
                        var isScrolling = false
                        val maxVolume = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC)
                        
                        override fun onDown(e: android.view.MotionEvent): Boolean {
                            startY = e.y
                            isLeftEdge = e.x < width / 2
                            startBrightness = window?.attributes?.screenBrightness?.takeIf { it >= 0 } ?: 0.5f
                            startVolume = audioManager.getStreamVolume(android.media.AudioManager.STREAM_MUSIC)
                            isScrolling = false
                            return true
                        }
                        
                        override fun onDoubleTap(e: android.view.MotionEvent): Boolean {
                            if (e.x < width / 2) {
                                exoPlayer.seekBack()
                            } else {
                                exoPlayer.seekForward()
                            }
                            return true
                        }

                        override fun onScroll(e1: android.view.MotionEvent?, e2: android.view.MotionEvent, distanceX: Float, distanceY: Float): Boolean {
                            if (e1 == null) return false
                            val deltaY = e1.y - e2.y
                            val deltaX = e1.x - e2.x
                            if (!isScrolling && kotlin.math.abs(deltaY) > kotlin.math.abs(deltaX) && kotlin.math.abs(deltaY) > 50) {
                                isScrolling = true
                            }
                            if (isScrolling) {
                                val dragFraction = deltaY / height
                                if (isLeftEdge) {
                                    val newBrightness = (startBrightness + dragFraction).coerceIn(0f, 1f)
                                    window?.let {
                                        val attributes = it.attributes
                                        attributes.screenBrightness = newBrightness
                                        it.attributes = attributes
                                    }
                                    brightnessLevel = newBrightness
                                    showBrightnessIndicator = true
                                    showVolumeIndicator = false
                                } else {
                                    val newVolume = (startVolume + (dragFraction * maxVolume).toInt()).coerceIn(0, maxVolume)
                                    audioManager.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, newVolume, 0)
                                    volumeLevel = newVolume.toFloat() / maxVolume.toFloat()
                                    showVolumeIndicator = true
                                    showBrightnessIndicator = false
                                }
                                return true
                            }
                            return false
                        }
                    })

                    setOnTouchListener { _, event ->
                        gestureDetector.onTouchEvent(event)
                        false
                    }
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .then(dragModifier),
            update = { playerView ->
                // Always fill layout bounds
                playerView.resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FILL
                
                val contentFrame = playerView.findViewById<android.view.View>(androidx.media3.ui.R.id.exo_content_frame)
                if (contentFrame != null) {
                    val lp = contentFrame.layoutParams as android.widget.FrameLayout.LayoutParams
                    lp.width = targetWidthPx
                    lp.height = targetHeightPx
                    lp.gravity = android.view.Gravity.CENTER
                    contentFrame.layoutParams = lp
                    contentFrame.translationX = panOffset
                }
            }
        )
    }
    
    // UI Overlays
    Box(Modifier.fillMaxSize()) {
        // Top Controls
        androidx.compose.material3.IconButton(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp),
            onClick = { 
                exoPlayer.pause()
                onBack() 
            }
        ) {
             androidx.compose.material3.Icon(
                 imageVector = androidx.compose.material.icons.Icons.AutoMirrored.Filled.ArrowBack,
                 contentDescription = "Back",
                 tint = Color.White
             )
        }

        if (errorMessage != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .background(Color.Black.copy(alpha = 0.8f))
                    .padding(16.dp)
            ) {
                Text(
                    text = errorMessage!!,
                    color = Color.Red,
                    style = androidx.compose.material3.MaterialTheme.typography.bodyLarge
                )
            }
        }
        
        // Indicators
        Box(modifier = Modifier.fillMaxSize()) {
            val safeBrightness = if (brightnessLevel.isNaN()) 0f else brightnessLevel.coerceIn(0f, 1f)
            val safeVolume = if (volumeLevel.isNaN()) 0f else volumeLevel.coerceIn(0f, 1f)

            AnimatedVisibility(
                visible = showBrightnessIndicator,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.CenterStart).padding(start = 32.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(16.dp)).padding(vertical = 16.dp, horizontal = 12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.BrightnessMedium,
                        contentDescription = "Brightness",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(150.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(Color.White.copy(alpha = 0.3f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .fillMaxHeight(safeBrightness)
                                .align(Alignment.BottomCenter)
                                .background(Color.White)
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = showVolumeIndicator,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.CenterEnd).padding(end = 32.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(16.dp)).padding(vertical = 16.dp, horizontal = 12.dp)
                ) {
                    Icon(
                        imageVector = if (safeVolume > 0) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                        contentDescription = "Volume",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(150.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(Color.White.copy(alpha = 0.3f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .fillMaxHeight(safeVolume)
                                .align(Alignment.BottomCenter)
                                .background(Color.White)
                        )
                    }
                }
            }
        }
    }
}
