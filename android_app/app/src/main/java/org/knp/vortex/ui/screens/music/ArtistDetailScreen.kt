package org.knp.vortex.ui.screens.music

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextAlign
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
import org.knp.vortex.data.remote.ArtistDetailDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.AppHeader
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.ModernMediaCard
import org.knp.vortex.utils.formatImageUrl
import javax.inject.Inject

data class ArtistDetailUiState(
    val artist: ArtistDetailDto? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class ArtistDetailViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(ArtistDetailUiState())
    val uiState: StateFlow<ArtistDetailUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(serverUrl = settingsRepository.getServerUrl())
    }

    fun load(id: Long) {
        if (_uiState.value.artist?.id == id) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getArtistDetail(id)
                .onSuccess { _uiState.value = _uiState.value.copy(artist = it, isLoading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
        }
    }
}

@Composable
fun ArtistDetailScreen(
    artistId: Long,
    onOpenAlbum: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: ArtistDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(artistId) { viewModel.load(artistId) }

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = { AppHeader(title = state.artist?.name ?: "Artist", onBack = onBack) }
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
                    val artist = state.artist
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = 120.dp),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxSize().padding(padding)
                    ) {
                        if (artist != null) {
                            item(span = { GridItemSpan(maxLineSpan) }) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                    val img = formatImageUrl(artist.image_url, state.serverUrl)
                                    if (img != null) {
                                        AsyncImage(
                                            model = img,
                                            contentDescription = artist.name,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.size(140.dp).clip(CircleShape)
                                        )
                                        Spacer(Modifier.height(12.dp))
                                    }
                                    Text(artist.name, color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.headlineSmall)
                                    artist.bio?.takeIf { it.isNotBlank() }?.let {
                                        Spacer(Modifier.height(8.dp))
                                        Text(
                                            it,
                                            color = Color.White.copy(alpha = 0.7f),
                                            style = MaterialTheme.typography.bodySmall,
                                            textAlign = TextAlign.Center,
                                            maxLines = 4
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                }
                            }
                            items(artist.albums) { album ->
                                ModernMediaCard(
                                    title = album.title,
                                    posterUrl = formatImageUrl(album.poster_url, state.serverUrl),
                                    year = album.year,
                                    onClick = { onOpenAlbum(album.id) },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
