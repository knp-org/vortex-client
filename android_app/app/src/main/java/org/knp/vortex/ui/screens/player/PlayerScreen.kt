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
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.foundation.layout.size
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
    var videoSize by remember { mutableStateOf<androidx.media3.common.VideoSize?>(null) }

    LaunchedEffect(mediaId) {
        viewModel.getSubtitles(mediaId) { subs ->
            subtitles = subs
            subtitlesLoaded = true
            if (progressLoaded) isReady = true
        }
        viewModel.getProgress(mediaId) { pos ->
            savedPosition = pos
            progressLoaded = true
            if (subtitlesLoaded) isReady = true
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
                        errorMessage = "Error: ${error.message}\nCode: ${error.errorCodeName}"
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
            
            // Enter Immersive Fullscreen
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
            controller.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        onDispose {
            // Restore default configuration on exit
             if (activity != null && window != null) {
                 activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
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
        
    }
}
