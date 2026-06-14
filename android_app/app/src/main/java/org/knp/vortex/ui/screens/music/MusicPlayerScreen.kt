package org.knp.vortex.ui.screens.music

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.PlaylistAdd
import androidx.compose.material.icons.automirrored.filled.QueueMusic
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Lyrics
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.RepeatOne
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import org.knp.vortex.ui.theme.DeepBackground
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import android.content.ComponentName
import android.net.Uri
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import org.knp.vortex.data.player.PlaybackService
import coil.compose.AsyncImage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.Call
import okhttp3.OkHttpClient
import org.knp.vortex.data.player.MusicQueue
import org.knp.vortex.data.remote.LyricsDto
import org.knp.vortex.data.remote.TrackDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.data.repository.SettingsRepository
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.utils.formatImageUrl
import javax.inject.Inject

@HiltViewModel
class MusicPlayerViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: SettingsRepository,
    private val okHttpClient: OkHttpClient,
    private val queue: MusicQueue
) : ViewModel() {

    val callFactory: Call.Factory get() = okHttpClient
    fun getServerUrl(): String = settingsRepository.getServerUrl()
    fun getToken(): String? = settingsRepository.getAuthToken()

    val tracks: List<TrackDto> get() = queue.tracks
    val startIndex: Int get() = queue.startIndex
    val queueTitle: String get() = queue.title

    private var handledRequestId: Long = -1L

    /**
     * True the first time it's called for the current play request, then false on
     * later calls until a new track is picked. Survives config-change recomposition
     * because the ViewModel outlives it — so rotating the device re-attaches to the
     * running track instead of restarting it.
     */
    fun consumePlayRequest(): Boolean {
        if (handledRequestId == queue.requestId) return false
        handledRequestId = queue.requestId
        return true
    }

    private val _lyrics = MutableStateFlow<LyricsDto?>(null)
    val lyrics: StateFlow<LyricsDto?> = _lyrics.asStateFlow()

    fun loadLyrics(trackId: Long, force: Boolean = false) {
        _lyrics.value = null
        viewModelScope.launch {
            repository.getTrackLyrics(trackId, force).onSuccess { _lyrics.value = it }
        }
    }
}

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
@Composable
fun MusicPlayerScreen(
    onBack: () -> Unit,
    viewModel: MusicPlayerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lyrics by viewModel.lyrics.collectAsState()
    val tracks = remember { viewModel.tracks }

    // The player lives in PlaybackService (a foreground MediaSessionService), so
    // audio keeps playing when we leave this screen or background the app. We
    // attach to it through a MediaController and release only the controller on
    // dispose — never the session/player.
    var controller by remember { mutableStateOf<MediaController?>(null) }

    var currentIndex by remember { mutableStateOf(viewModel.startIndex) }
    var isPlaying by remember { mutableStateOf(false) }
    var position by remember { mutableStateOf(0L) }
    var duration by remember { mutableStateOf(0L) }
    var shuffle by remember { mutableStateOf(false) }
    var repeatMode by remember { mutableStateOf(Player.REPEAT_MODE_OFF) }
    var volume by remember { mutableStateOf(1f) }
    var muted by remember { mutableStateOf(false) }

    // Full-screen overlays (kept in-composition so playback continues).
    var showLyrics by remember { mutableStateOf(false) }
    var showQueue by remember { mutableStateOf(false) }
    var showAddToPlaylist by remember { mutableStateOf(false) }

    val listener = remember {
        object : Player.Listener {
            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                val c = controller ?: return
                val idx = c.currentMediaItemIndex
                currentIndex = idx
                tracks.getOrNull(idx)?.let { viewModel.loadLyrics(it.id) }
            }
            override fun onIsPlayingChanged(playing: Boolean) { isPlaying = playing }
        }
    }

    // Connect to the playback service, then either start the requested queue or,
    // if that same queue is already playing, just attach to it.
    DisposableEffect(Unit) {
        val token = SessionToken(context, ComponentName(context, PlaybackService::class.java))
        val future = MediaController.Builder(context, token).buildAsync()
        future.addListener({
            val c = try { future.get() } catch (e: Exception) { null } ?: return@addListener
            controller = c
            c.addListener(listener)

            val desiredIds = tracks.map { it.id.toString() }
            val currentIds = (0 until c.mediaItemCount).map { c.getMediaItemAt(it).mediaId }
            val freshRequest = viewModel.consumePlayRequest()
            when {
                desiredIds.isNotEmpty() && desiredIds != currentIds -> {
                    // New queue requested — load and start it.
                    val items = buildMediaItems(tracks, viewModel.getServerUrl(), viewModel.getToken())
                    val start = viewModel.startIndex.coerceIn(0, items.size - 1)
                    c.setMediaItems(items, start, 0L)
                    c.prepare()
                    c.playWhenReady = true
                    currentIndex = start
                }
                freshRequest && desiredIds.isNotEmpty() -> {
                    // Same queue already loaded, but the user explicitly tapped a
                    // (possibly different) track — jump to it and play.
                    val start = viewModel.startIndex.coerceIn(0, desiredIds.size - 1)
                    c.seekTo(start, 0L)
                    c.playWhenReady = true
                    currentIndex = start
                }
                else -> {
                    // Re-attaching to playback already in progress (e.g. config change).
                    currentIndex = c.currentMediaItemIndex
                }
            }
            isPlaying = c.isPlaying
            shuffle = c.shuffleModeEnabled
            repeatMode = c.repeatMode
            volume = c.volume
            tracks.getOrNull(currentIndex)?.let { viewModel.loadLyrics(it.id) }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            controller?.removeListener(listener)
            MediaController.releaseFuture(future)
            controller = null
        }
    }

    // Poll position/duration for the seek bar.
    LaunchedEffect(controller) {
        val c = controller ?: return@LaunchedEffect
        while (true) {
            position = c.currentPosition.coerceAtLeast(0L)
            duration = c.duration.let { if (it > 0) it else 0L }
            delay(500)
        }
    }

    // System back closes any open overlay before leaving the player.
    BackHandler(enabled = showLyrics || showQueue) {
        showLyrics = false
        showQueue = false
    }

    val track = tracks.getOrNull(currentIndex)
    val cover = formatImageUrl(track?.cover_url, viewModel.getServerUrl())

    GlassyBackground {
        PlayerBackdrop(cover = cover, modifier = Modifier.fillMaxSize()) {
            Scaffold(containerColor = Color.Transparent) { padding ->
                Column(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Filled.KeyboardArrowDown, contentDescription = "Collapse", tint = Color.White, modifier = Modifier.size(28.dp))
                        }
                        Spacer(Modifier.weight(1f))
                        Text(
                            "NOW PLAYING",
                            color = Color.White.copy(alpha = 0.6f),
                            style = MaterialTheme.typography.labelMedium,
                            letterSpacing = 2.sp
                        )
                        Spacer(Modifier.weight(1f))
                        Spacer(Modifier.width(48.dp))
                    }

                    // Album art (fills available space, stays square)
                    Box(
                        modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 28.dp, vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.82f)
                                .aspectRatio(1f)
                                .shadow(28.dp, RoundedCornerShape(20.dp))
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color.White.copy(alpha = 0.06f)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (cover != null) {
                                AsyncImage(
                                    model = cover,
                                    contentDescription = track?.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Icon(Icons.Filled.MusicNote, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(72.dp))
                            }
                        }
                    }

                    // Track info
                    Text(
                        track?.title ?: "—",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleLarge,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)
                    )
                    Text(
                        track?.artist ?: "Unknown Artist",
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    track?.album?.let {
                        Text(
                            it,
                            color = Color.White.copy(alpha = 0.5f),
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Spacer(Modifier.height(18.dp))

                    // Seek bar (thin) with drag-to-seek reconcile
                    val safeDuration = if (duration > 0) duration else 0L
                    val maxF = if (safeDuration > 0) safeDuration.toFloat() else 1f
                    var seeking by remember { mutableStateOf(false) }
                    var seekValue by remember { mutableStateOf(0f) }
                    val seekDisplay = if (seeking) seekValue else position.coerceIn(0, safeDuration).toFloat()
                    LiquidSlider(
                        value = seekDisplay.coerceIn(0f, maxF),
                        valueRange = 0f..maxF,
                        onValueChange = { seeking = true; seekValue = it },
                        onValueChangeFinished = {
                            controller?.seekTo(seekValue.toLong())
                            seeking = false
                        },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)
                    )
                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 26.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(formatMs(if (seeking) seekValue.toLong() else position), color = Color.White.copy(alpha = 0.6f), style = MaterialTheme.typography.labelSmall)
                        Text(formatMs(safeDuration), color = Color.White.copy(alpha = 0.6f), style = MaterialTheme.typography.labelSmall)
                    }

                    Spacer(Modifier.height(8.dp))

                    // Transport controls
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        IconButton(onClick = {
                            shuffle = !shuffle
                            controller?.shuffleModeEnabled = shuffle
                        }) {
                            Icon(Icons.Filled.Shuffle, contentDescription = "Shuffle", tint = if (shuffle) Color.White else Color.White.copy(alpha = 0.8f))
                        }
                        IconButton(onClick = { controller?.let { it.seekTo((it.currentPosition - 10_000).coerceAtLeast(0)) } }) {
                            Icon(Icons.Filled.Replay10, contentDescription = "Back 10s", tint = Color.White.copy(alpha = 0.8f))
                        }
                        IconButton(onClick = { controller?.seekToPreviousMediaItem() }) {
                            Icon(Icons.Filled.SkipPrevious, contentDescription = "Previous", tint = Color.White, modifier = Modifier.size(36.dp))
                        }
                        Box(
                            modifier = Modifier
                                .size(62.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .clickable { controller?.let { if (it.isPlaying) it.pause() else it.play() } },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                                contentDescription = "Play/Pause",
                                tint = DeepBackground,
                                modifier = Modifier.size(34.dp)
                            )
                        }
                        IconButton(onClick = { controller?.seekToNextMediaItem() }) {
                            Icon(Icons.Filled.SkipNext, contentDescription = "Next", tint = Color.White, modifier = Modifier.size(36.dp))
                        }
                        IconButton(onClick = {
                            val d = if (duration > 0) duration else Long.MAX_VALUE
                            controller?.let { it.seekTo((it.currentPosition + 10_000).coerceAtMost(d)) }
                        }) {
                            Icon(Icons.Filled.Forward10, contentDescription = "Forward 10s", tint = Color.White.copy(alpha = 0.8f))
                        }
                        IconButton(onClick = {
                            repeatMode = when (repeatMode) {
                                Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                                Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                                else -> Player.REPEAT_MODE_OFF
                            }
                            controller?.repeatMode = repeatMode
                        }) {
                            Icon(
                                if (repeatMode == Player.REPEAT_MODE_ONE) Icons.Filled.RepeatOne else Icons.Filled.Repeat,
                                contentDescription = "Repeat",
                                tint = if (repeatMode != Player.REPEAT_MODE_OFF) Color.White else Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }

                    Spacer(Modifier.height(6.dp))

                    // Volume
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        IconButton(onClick = {
                            muted = !muted
                            controller?.volume = if (muted) 0f else volume
                        }) {
                            Icon(
                                if (muted || volume == 0f) Icons.AutoMirrored.Filled.VolumeOff else Icons.AutoMirrored.Filled.VolumeUp,
                                contentDescription = "Mute",
                                tint = Color.White.copy(alpha = 0.8f)
                            )
                        }
                        LiquidSlider(
                            value = if (muted) 0f else volume,
                            valueRange = 0f..1f,
                            onValueChange = {
                                volume = it
                                muted = false
                                controller?.volume = it
                            },
                            modifier = Modifier.width(150.dp)
                        )
                    }

                    Spacer(Modifier.height(14.dp))

                    // Secondary actions: Lyrics + Up Next open full-screen panels
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)
                    ) {
                        PlayerActionButton(Icons.Filled.Lyrics, "Lyrics", Modifier.weight(1f)) { showLyrics = true }
                        PlayerActionButton(Icons.AutoMirrored.Filled.QueueMusic, "Up Next", Modifier.weight(1f)) { showQueue = true }
                        PlayerActionButton(Icons.AutoMirrored.Filled.PlaylistAdd, "Add to Playlist", Modifier.weight(1f)) { showAddToPlaylist = true }
                    }

                    Spacer(Modifier.height(20.dp))
                }
            }

            // ── Full-screen Lyrics overlay ───────────────────────────────────
            AnimatedVisibility(visible = showLyrics, enter = fadeIn(), exit = fadeOut()) {
                val trackId = track?.id
                LyricsScreen(
                    title = track?.title,
                    artist = track?.artist,
                    cover = cover,
                    lyrics = lyrics,
                    positionMs = position,
                    onClose = { showLyrics = false },
                    onReDownload = {
                        if (trackId != null) {
                            viewModel.loadLyrics(trackId, force = true)
                        }
                    }
                )
            }

            // ── Full-screen Up-Next overlay ──────────────────────────────────
            AnimatedVisibility(visible = showQueue, enter = fadeIn(), exit = fadeOut()) {
                QueueScreen(
                    cover = cover,
                    tracks = tracks,
                    currentIndex = currentIndex,
                    onJumpTo = { idx ->
                        controller?.let {
                            it.seekTo(idx, 0L)
                            it.play()
                        }
                        showQueue = false
                    },
                    onClose = { showQueue = false }
                )
            }

            // ── Add-to-playlist bottom sheet for the current track ───────────
            if (showAddToPlaylist) {
                val trackId = track?.id
                if (trackId != null) {
                    org.knp.vortex.ui.components.AddToPlaylistSheet(
                        trackIds = listOf(trackId),
                        onDismiss = { showAddToPlaylist = false }
                    )
                } else {
                    showAddToPlaylist = false
                }
            }
        }
    }
}

/** Blurred album-art backdrop with darkening gradient over a solid base. */
@Composable
private fun PlayerBackdrop(cover: String?, modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    Box(modifier = modifier.background(DeepBackground)) {
        if (cover != null) {
            AsyncImage(
                model = cover,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                alpha = 0.35f,
                modifier = Modifier.fillMaxSize().blur(60.dp)
            )
        }
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.verticalGradient(
                    listOf(Color.Black.copy(alpha = 0.4f), Color.Black.copy(alpha = 0.6f), Color.Black.copy(alpha = 0.92f))
                )
            )
        )
        content()
    }
}

/** Thin, monochromatic slider: 4dp track + small white thumb (Liquid Glass). */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LiquidSlider(
    value: Float,
    valueRange: ClosedFloatingPointRange<Float>,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    onValueChangeFinished: (() -> Unit)? = null,
) {
    val span = valueRange.endInclusive - valueRange.start
    val fraction = if (span > 0f) ((value - valueRange.start) / span).coerceIn(0f, 1f) else 0f
    Slider(
        value = value,
        onValueChange = onValueChange,
        onValueChangeFinished = onValueChangeFinished,
        valueRange = valueRange,
        modifier = modifier,
        thumb = {
            Box(
                Modifier
                    .size(13.dp)
                    .clip(CircleShape)
                    .background(Color.White)
            )
        },
        track = {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.22f))
            ) {
                Box(
                    Modifier
                        .fillMaxWidth(fraction)
                        .fillMaxHeight()
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
        }
    )
}

/** Glassy pill action button (icon + label). */
@Composable
private fun PlayerActionButton(icon: ImageVector, label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally)
    ) {
        Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(18.dp))
        Text(
            label,
            color = Color.White,
            style = MaterialTheme.typography.labelLarge,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

/** Header used by the full-screen overlays: back arrow + title/subtitle. */
@Composable
private fun OverlayHeader(title: String, subtitle: String?, onClose: () -> Unit, actionIcon: ImageVector? = null, onAction: (() -> Unit)? = null) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onClose) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White, modifier = Modifier.size(26.dp))
        }
        Spacer(Modifier.width(4.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = Color.White, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, color = Color.White.copy(alpha = 0.6f), style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        if (actionIcon != null && onAction != null) {
            IconButton(onClick = onAction) {
                Icon(actionIcon, contentDescription = "Action", tint = Color.White, modifier = Modifier.size(24.dp))
            }
        }
    }
}

@Composable
private fun LyricsScreen(
    title: String?,
    artist: String?,
    cover: String?,
    lyrics: LyricsDto?,
    positionMs: Long,
    onClose: () -> Unit,
    onReDownload: () -> Unit
) {
    PlayerBackdrop(cover = cover, modifier = Modifier.fillMaxSize()) {
        Scaffold(containerColor = Color.Transparent) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                OverlayHeader(
                    title = "Lyrics",
                    subtitle = listOfNotNull(title, artist).joinToString(" · ").ifBlank { null },
                    onClose = onClose,
                    actionIcon = Icons.Filled.Refresh,
                    onAction = onReDownload
                )
                LyricsPane(
                    lyrics = lyrics,
                    positionMs = positionMs,
                    modifier = Modifier.fillMaxWidth().weight(1f)
                )
            }
        }
    }
}

@Composable
private fun QueueScreen(
    cover: String?,
    tracks: List<TrackDto>,
    currentIndex: Int,
    onJumpTo: (Int) -> Unit,
    onClose: () -> Unit
) {
    PlayerBackdrop(cover = cover, modifier = Modifier.fillMaxSize()) {
        Scaffold(containerColor = Color.Transparent) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                OverlayHeader("Up Next", "${tracks.size} tracks", onClose)
                QueuePane(
                    tracks = tracks,
                    currentIndex = currentIndex,
                    onJumpTo = onJumpTo,
                    modifier = Modifier.fillMaxWidth().weight(1f)
                )
            }
        }
    }
}

@Composable
private fun QueuePane(
    tracks: List<TrackDto>,
    currentIndex: Int,
    onJumpTo: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    if (tracks.isEmpty()) {
        Box(modifier, contentAlignment = Alignment.Center) {
            Text("Queue is empty", color = Color.White.copy(alpha = 0.4f), style = MaterialTheme.typography.bodyMedium)
        }
        return
    }
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp)
    ) {
        itemsIndexed(tracks) { index, track ->
            val current = index == currentIndex
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (current) Color.White.copy(alpha = 0.06f) else Color.Transparent)
                    .clickable { onJumpTo(index) }
                    .padding(vertical = 8.dp, horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.width(24.dp), contentAlignment = Alignment.Center) {
                    if (current) {
                        Icon(Icons.Filled.MusicNote, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    } else {
                        Text("${index + 1}", color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelMedium)
                    }
                }
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        track.title ?: "Unknown",
                        color = if (current) Color.White else Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    val subtitle = track.artist ?: track.album
                    if (!subtitle.isNullOrBlank()) {
                        Text(subtitle, color = Color.White.copy(alpha = 0.55f), style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
                val dur = formatMs((track.duration ?: 0L) * 1000)
                if (track.duration != null && track.duration > 0) {
                    Spacer(Modifier.width(8.dp))
                    Text(dur, color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

@Composable
private fun LyricsPane(lyrics: LyricsDto?, positionMs: Long, modifier: Modifier = Modifier) {
    val lines = lyrics?.lines.orEmpty()
    if (lyrics == null) {
        Box(modifier, contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(28.dp))
        }
        return
    }
    if (lines.isEmpty()) {
        Box(modifier, contentAlignment = Alignment.Center) {
            Text("No lyrics available", color = Color.White.copy(alpha = 0.4f), style = MaterialTheme.typography.bodyMedium)
        }
        return
    }

    val synced = lyrics.synced
    val activeIndex = if (synced) {
        val secs = positionMs / 1000.0
        lines.indexOfLast { (it.time ?: -1.0) <= secs }.coerceAtLeast(0)
    } else -1

    val listState = rememberLazyListState()
    LaunchedEffect(activeIndex) {
        if (synced && activeIndex >= 0) {
            listState.animateScrollToItem(activeIndex.coerceAtLeast(0))
        }
    }

    LazyColumn(
        state = listState,
        modifier = modifier,
        contentPadding = PaddingValues(horizontal = 28.dp, vertical = 48.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        itemsIndexed(lines) { index, line ->
            val isActive = synced && index == activeIndex
            Text(
                text = line.text.ifBlank { "♪" },
                color = if (isActive) Color.White else Color.White.copy(alpha = 0.5f),
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                fontSize = if (isActive) 24.sp else 18.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
        if (lyrics.source == "lrclib") {
            item {
                Text(
                    "Lyrics via lrclib.net",
                    color = Color.White.copy(alpha = 0.35f),
                    style = MaterialTheme.typography.labelSmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
                )
            }
        }
    }
}

/** Builds the playback queue with metadata so the media notification shows
 *  title/artist/artwork. Artwork loads through the service's authenticated client. */
private fun buildMediaItems(tracks: List<TrackDto>, serverUrl: String, token: String?): List<MediaItem> {
    val base = serverUrl.trimEnd('/')
    val tq = if (token != null) "?token=$token" else ""
    return tracks.map { track ->
        val artwork = formatImageUrl(track.cover_url, serverUrl)
        val metadata = MediaMetadata.Builder()
            .setTitle(track.title)
            .setArtist(track.artist)
            .setAlbumTitle(track.album)
            .apply { artwork?.let { setArtworkUri(Uri.parse(it)) } }
            .build()
        MediaItem.Builder()
            .setUri("$base/api/v1/stream/${track.id}$tq")
            .setMediaId(track.id.toString())
            .setMediaMetadata(metadata)
            .build()
    }
}

private fun formatMs(ms: Long): String {
    if (ms <= 0) return "0:00"
    val totalSecs = ms / 1000
    val m = totalSecs / 60
    val s = totalSecs % 60
    return "%d:%02d".format(m, s)
}
