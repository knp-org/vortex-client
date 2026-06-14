package org.knp.vortex.ui.screens.music

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.AlbumDetailDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.AppHeader
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.utils.formatImageUrl
import javax.inject.Inject

data class AlbumDetailUiState(
    val album: AlbumDetailDto? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class AlbumDetailViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository,
    private val musicQueue: org.knp.vortex.data.player.MusicQueue
) : ViewModel() {
    private val _uiState = MutableStateFlow(AlbumDetailUiState())
    val uiState: StateFlow<AlbumDetailUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(serverUrl = settingsRepository.getServerUrl())
    }

    /** Loads this album's tracks into the shared player queue starting at [index]. */
    fun playTrack(index: Int) {
        val album = _uiState.value.album ?: return
        musicQueue.set(album.tracks, index, title = album.title)
    }

    fun load(id: Long) {
        if (_uiState.value.album?.id == id) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getAlbumDetail(id)
                .onSuccess { _uiState.value = _uiState.value.copy(album = it, isLoading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
        }
    }
}

internal fun formatDuration(seconds: Long?): String {
    if (seconds == null || seconds <= 0) return ""
    val m = seconds / 60
    val s = seconds % 60
    return "%d:%02d".format(m, s)
}

@Composable
fun AlbumDetailScreen(
    albumId: Long,
    onPlayTrack: () -> Unit,
    onBack: () -> Unit,
    viewModel: AlbumDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(albumId) { viewModel.load(albumId) }

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = { AppHeader(title = state.album?.title ?: "Album", onBack = onBack) }
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
                    val album = state.album
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.fillMaxSize().padding(padding)
                    ) {
                        if (album != null) {
                            item {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                    val cover = formatImageUrl(album.cover_url, state.serverUrl)
                                    if (cover != null) {
                                        AsyncImage(
                                            model = cover,
                                            contentDescription = album.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.size(200.dp).clip(RoundedCornerShape(12.dp))
                                        )
                                        Spacer(Modifier.height(12.dp))
                                    }
                                    Text(album.title, color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                                    val subtitle = listOfNotNull(album.artist, album.year?.toString()).joinToString(" • ")
                                    if (subtitle.isNotBlank()) {
                                        Text(subtitle, color = Color.White.copy(alpha = 0.7f), style = MaterialTheme.typography.bodyMedium)
                                    }
                                    Spacer(Modifier.height(16.dp))
                                }
                            }
                            itemsIndexed(album.tracks) { index, track ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable { viewModel.playTrack(index); onPlayTrack() }
                                        .padding(vertical = 10.dp, horizontal = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(modifier = Modifier.width(28.dp), contentAlignment = Alignment.Center) {
                                        val number = track.track_number?.toString()
                                        if (number != null) {
                                            Text(number, color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.bodyMedium)
                                        } else {
                                            Icon(Icons.Filled.MusicNote, contentDescription = null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(18.dp))
                                        }
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    Text(
                                        text = track.title ?: "Unknown",
                                        color = Color.White,
                                        style = MaterialTheme.typography.bodyLarge,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    val dur = formatDuration(track.duration)
                                    if (dur.isNotBlank()) {
                                        Spacer(Modifier.width(8.dp))
                                        Text(dur, color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.bodySmall)
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
