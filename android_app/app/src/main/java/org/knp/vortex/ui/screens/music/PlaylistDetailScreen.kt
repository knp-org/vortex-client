package org.knp.vortex.ui.screens.music

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.RemoveCircleOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.PlaylistDetailDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.AppHeader
import org.knp.vortex.ui.components.GlassyBackground
import javax.inject.Inject

data class PlaylistDetailUiState(
    val playlist: PlaylistDetailDto? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class PlaylistDetailViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val musicQueue: org.knp.vortex.data.player.MusicQueue
) : ViewModel() {
    private val _uiState = MutableStateFlow(PlaylistDetailUiState())
    val uiState: StateFlow<PlaylistDetailUiState> = _uiState.asStateFlow()

    private var playlistId: Long = -1

    /** Loads this playlist's tracks into the shared player queue starting at [index]. */
    fun playTrack(index: Int) {
        val playlist = _uiState.value.playlist ?: return
        if (playlist.tracks.isEmpty()) return
        musicQueue.set(playlist.tracks, index, title = playlist.name)
    }

    fun load(id: Long) {
        playlistId = id
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getPlaylistDetail(id)
                .onSuccess { _uiState.value = _uiState.value.copy(playlist = it, isLoading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
        }
    }

    /** Removes a track from the playlist, then reloads to reflect server state. */
    fun removeTrack(itemId: Long) {
        if (playlistId < 0) return
        viewModelScope.launch {
            repository.removeTrackFromPlaylist(playlistId, itemId)
                .onSuccess { load(playlistId) }
                .onFailure { _uiState.value = _uiState.value.copy(error = it.message) }
        }
    }
}

@Composable
fun PlaylistDetailScreen(
    playlistId: Long,
    onPlayTrack: () -> Unit,
    onBack: () -> Unit,
    viewModel: PlaylistDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(playlistId) { viewModel.load(playlistId) }

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = { AppHeader(title = state.playlist?.name ?: "Playlist", onBack = onBack) }
        ) { padding ->
            when {
                state.isLoading -> {
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                }
                state.error != null -> {
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        Text(state.error ?: "Error", color = Color.Red)
                    }
                }
                else -> {
                    val playlist = state.playlist
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.fillMaxSize().padding(padding)
                    ) {
                        if (playlist != null) {
                            item {
                                Column(modifier = Modifier.fillMaxWidth()) {
                                    Text(
                                        playlist.name,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.headlineSmall
                                    )
                                    Text(
                                        "${playlist.tracks.size} tracks",
                                        color = Color.White.copy(alpha = 0.6f),
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    if (playlist.tracks.isNotEmpty()) {
                                        Spacer(Modifier.height(12.dp))
                                        Button(
                                            onClick = { viewModel.playTrack(0); onPlayTrack() },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = Color.White,
                                                contentColor = org.knp.vortex.ui.theme.DeepBackground
                                            )
                                        ) {
                                            Icon(Icons.Filled.PlayArrow, contentDescription = null)
                                            Spacer(Modifier.width(8.dp))
                                            Text("Play all", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(Modifier.height(8.dp))
                                }
                            }

                            if (playlist.tracks.isEmpty()) {
                                item {
                                    Box(Modifier.fillMaxWidth().padding(top = 48.dp), contentAlignment = Alignment.Center) {
                                        Text("This playlist is empty.", color = Color.White.copy(alpha = 0.6f))
                                    }
                                }
                            }

                            itemsIndexed(playlist.tracks) { index, track ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable { viewModel.playTrack(index); onPlayTrack() }
                                        .padding(vertical = 10.dp, horizontal = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(modifier = Modifier.width(28.dp), contentAlignment = Alignment.Center) {
                                        Text(
                                            "${index + 1}",
                                            color = Color.White.copy(alpha = 0.5f),
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = track.title ?: "Unknown",
                                            color = Color.White,
                                            style = MaterialTheme.typography.bodyLarge,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        val subtitle = listOfNotNull(track.artist, track.album).joinToString(" • ")
                                        if (subtitle.isNotBlank()) {
                                            Text(
                                                text = subtitle,
                                                color = Color.White.copy(alpha = 0.5f),
                                                style = MaterialTheme.typography.bodySmall,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }
                                    val dur = formatDuration(track.duration)
                                    if (dur.isNotBlank()) {
                                        Spacer(Modifier.width(8.dp))
                                        Text(dur, color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.bodySmall)
                                    }
                                    IconButton(onClick = { viewModel.removeTrack(track.id) }) {
                                        Icon(
                                            Icons.Filled.RemoveCircleOutline,
                                            contentDescription = "Remove from playlist",
                                            tint = Color.White.copy(alpha = 0.6f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
