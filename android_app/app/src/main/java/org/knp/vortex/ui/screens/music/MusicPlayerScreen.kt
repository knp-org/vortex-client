package org.knp.vortex.ui.screens.music

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
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
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
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
import org.knp.vortex.ui.theme.PrimaryBlue
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

    private val _lyrics = MutableStateFlow<LyricsDto?>(null)
    val lyrics: StateFlow<LyricsDto?> = _lyrics.asStateFlow()

    fun loadLyrics(trackId: Long) {
        _lyrics.value = null
        viewModelScope.launch {
            repository.getTrackLyrics(trackId).onSuccess { _lyrics.value = it }
        }
    }
}

private enum class PlayerTab { LYRICS, QUEUE }

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
@Composable
fun MusicPlayerScreen(
    onBack: () -> Unit,
    viewModel: MusicPlayerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lyrics by viewModel.lyrics.collectAsState()
    val tracks = remember { viewModel.tracks }

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
    }

    var currentIndex by remember { mutableStateOf(viewModel.startIndex) }
    var isPlaying by remember { mutableStateOf(false) }
    var position by remember { mutableStateOf(0L) }
    var duration by remember { mutableStateOf(0L) }
    var shuffle by remember { mutableStateOf(false) }
    var repeatMode by remember { mutableStateOf(Player.REPEAT_MODE_OFF) }
    var volume by remember { mutableStateOf(1f) }
    var muted by remember { mutableStateOf(false) }
    var tab by remember { mutableStateOf(PlayerTab.LYRICS) }

    // Build the playback queue once.
    LaunchedEffect(Unit) {
        if (tracks.isEmpty()) return@LaunchedEffect
        val base = viewModel.getServerUrl().trimEnd('/')
        val token = viewModel.getToken()
        val tq = if (token != null) "?token=$token" else ""
        val items = tracks.map { track ->
            MediaItem.Builder()
                .setUri("$base/api/v1/stream/${track.id}$tq")
                .setMediaId(track.id.toString())
                .build()
        }
        val start = viewModel.startIndex.coerceIn(0, items.size - 1)
        exoPlayer.setMediaItems(items, start, 0L)
        exoPlayer.prepare()
        exoPlayer.playWhenReady = true
        currentIndex = start
        viewModel.loadLyrics(tracks[start].id)
    }

    // Track index / playback state changes.
    DisposableEffect(exoPlayer) {
        val listener = object : Player.Listener {
            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                val idx = exoPlayer.currentMediaItemIndex
                currentIndex = idx
                tracks.getOrNull(idx)?.let { viewModel.loadLyrics(it.id) }
            }
            override fun onIsPlayingChanged(playing: Boolean) { isPlaying = playing }
        }
        exoPlayer.addListener(listener)
        onDispose { exoPlayer.removeListener(listener) }
    }

    // Poll position/duration for the seek bar.
    LaunchedEffect(exoPlayer) {
        while (true) {
            position = exoPlayer.currentPosition.coerceAtLeast(0L)
            duration = exoPlayer.duration.let { if (it > 0) it else 0L }
            delay(500)
        }
    }

    DisposableEffect(Unit) {
        onDispose { exoPlayer.release() }
    }

    val track = tracks.getOrNull(currentIndex)

    GlassyBackground {
        Box(modifier = Modifier.fillMaxSize()) {
            // Blurred album-art backdrop.
            val cover = formatImageUrl(track?.cover_url, viewModel.getServerUrl())
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

                    Spacer(Modifier.height(8.dp))

                    // Album art
                    Box(
                        modifier = Modifier
                            .size(260.dp)
                            .shadow(24.dp, RoundedCornerShape(16.dp))
                            .clip(RoundedCornerShape(16.dp)),
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
                            Box(Modifier.fillMaxSize().background(Color.White.copy(alpha = 0.06f)), contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.MusicNote, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(72.dp))
                            }
                        }
                    }

                    Spacer(Modifier.height(20.dp))

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

                    Spacer(Modifier.height(16.dp))

                    // Seek bar
                    val safeDuration = if (duration > 0) duration else 0L
                    Slider(
                        value = if (safeDuration > 0) position.coerceIn(0, safeDuration).toFloat() else 0f,
                        onValueChange = { exoPlayer.seekTo(it.toLong()) },
                        valueRange = 0f..(if (safeDuration > 0) safeDuration.toFloat() else 1f),
                        colors = SliderDefaults.colors(
                            thumbColor = PrimaryBlue,
                            activeTrackColor = PrimaryBlue
                        ),
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)
                    )
                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 28.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(formatMs(position), color = Color.White.copy(alpha = 0.6f), style = MaterialTheme.typography.labelSmall)
                        Text(formatMs(safeDuration), color = Color.White.copy(alpha = 0.6f), style = MaterialTheme.typography.labelSmall)
                    }

                    Spacer(Modifier.height(8.dp))

                    // Transport controls
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        IconButton(onClick = {
                            shuffle = !shuffle
                            exoPlayer.shuffleModeEnabled = shuffle
                        }) {
                            Icon(Icons.Filled.Shuffle, contentDescription = "Shuffle", tint = if (shuffle) PrimaryBlue else Color.White.copy(alpha = 0.8f))
                        }
                        IconButton(onClick = { exoPlayer.seekTo((exoPlayer.currentPosition - 10_000).coerceAtLeast(0)) }) {
                            Icon(Icons.Filled.Replay10, contentDescription = "Back 10s", tint = Color.White.copy(alpha = 0.8f))
                        }
                        IconButton(onClick = { exoPlayer.seekToPreviousMediaItem() }) {
                            Icon(Icons.Filled.SkipPrevious, contentDescription = "Previous", tint = Color.White, modifier = Modifier.size(36.dp))
                        }
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(PrimaryBlue)
                                .clickable { if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                                contentDescription = "Play/Pause",
                                tint = Color.White,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                        IconButton(onClick = { exoPlayer.seekToNextMediaItem() }) {
                            Icon(Icons.Filled.SkipNext, contentDescription = "Next", tint = Color.White, modifier = Modifier.size(36.dp))
                        }
                        IconButton(onClick = {
                            val d = if (duration > 0) duration else Long.MAX_VALUE
                            exoPlayer.seekTo((exoPlayer.currentPosition + 10_000).coerceAtMost(d))
                        }) {
                            Icon(Icons.Filled.Forward10, contentDescription = "Forward 10s", tint = Color.White.copy(alpha = 0.8f))
                        }
                        IconButton(onClick = {
                            repeatMode = when (repeatMode) {
                                Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                                Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                                else -> Player.REPEAT_MODE_OFF
                            }
                            exoPlayer.repeatMode = repeatMode
                        }) {
                            Icon(
                                if (repeatMode == Player.REPEAT_MODE_ONE) Icons.Filled.RepeatOne else Icons.Filled.Repeat,
                                contentDescription = "Repeat",
                                tint = if (repeatMode != Player.REPEAT_MODE_OFF) PrimaryBlue else Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    // Volume
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        IconButton(onClick = {
                            muted = !muted
                            exoPlayer.volume = if (muted) 0f else volume
                        }) {
                            Icon(
                                if (muted || volume == 0f) Icons.AutoMirrored.Filled.VolumeOff else Icons.AutoMirrored.Filled.VolumeUp,
                                contentDescription = "Mute",
                                tint = Color.White.copy(alpha = 0.8f)
                            )
                        }
                        Slider(
                            value = if (muted) 0f else volume,
                            onValueChange = {
                                volume = it
                                muted = false
                                exoPlayer.volume = it
                            },
                            valueRange = 0f..1f,
                            colors = SliderDefaults.colors(
                                thumbColor = PrimaryBlue,
                                activeTrackColor = PrimaryBlue
                            ),
                            modifier = Modifier.width(160.dp)
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    // Lyrics / Up Next tabs
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)
                    ) {
                        PlayerTabButton("Lyrics", tab == PlayerTab.LYRICS) { tab = PlayerTab.LYRICS }
                        PlayerTabButton("Up Next", tab == PlayerTab.QUEUE) { tab = PlayerTab.QUEUE }
                    }

                    Spacer(Modifier.height(8.dp))

                    when (tab) {
                        PlayerTab.LYRICS -> LyricsPane(
                            lyrics = lyrics,
                            positionMs = position,
                            modifier = Modifier.fillMaxWidth().weight(1f)
                        )
                        PlayerTab.QUEUE -> QueuePane(
                            tracks = tracks,
                            currentIndex = currentIndex,
                            onJumpTo = { idx ->
                                exoPlayer.seekTo(idx, 0L)
                                exoPlayer.play()
                            },
                            modifier = Modifier.fillMaxWidth().weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerTabButton(label: String, active: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (active) PrimaryBlue.copy(alpha = 0.18f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            label,
            color = if (active) PrimaryBlue else Color.White.copy(alpha = 0.7f),
            fontWeight = if (active) FontWeight.SemiBold else FontWeight.Normal,
            style = MaterialTheme.typography.labelLarge
        )
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
                        Icon(Icons.Filled.MusicNote, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(16.dp))
                    } else {
                        Text("${index + 1}", color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelMedium)
                    }
                }
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        track.title ?: "Unknown",
                        color = if (current) PrimaryBlue else Color.White,
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
        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        itemsIndexed(lines) { index, line ->
            val isActive = synced && index == activeIndex
            Text(
                text = line.text.ifBlank { "♪" },
                color = if (isActive) PrimaryBlue else Color.White.copy(alpha = 0.55f),
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                fontSize = if (isActive) 18.sp else 16.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

private fun formatMs(ms: Long): String {
    if (ms <= 0) return "0:00"
    val totalSecs = ms / 1000
    val m = totalSecs / 60
    val s = totalSecs % 60
    return "%d:%02d".format(m, s)
}
