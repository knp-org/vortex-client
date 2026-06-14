package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.Modifier
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.MediaItemDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.ModernMediaCard
import javax.inject.Inject

data class MovieLibraryUiState(
    val isLoading: Boolean = true,
    val items: List<MediaItemDto> = emptyList(),
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class MovieLibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {
    var uiState by mutableStateOf(MovieLibraryUiState(serverUrl = settingsRepository.getServerUrl()))
        private set

    fun load(libId: Long) {
        if (uiState.items.isNotEmpty()) return
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            repository.getLibraryMedia(libId)
                .onSuccess { uiState = uiState.copy(isLoading = false, items = it) }
                .onFailure { uiState = uiState.copy(isLoading = false, error = it.message) }
        }
    }
}

@Composable
fun MovieLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onPlayMedia: (Long, String?) -> Unit,
    onBack: () -> Unit,
    viewModel: MovieLibraryViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    LaunchedEffect(libraryId) { viewModel.load(libraryId) }

    LibraryScaffold(title = libraryDisplayTitle(libraryName, libraryType), onBack = onBack) {
        when {
            uiState.isLoading -> LibraryLoading()
            uiState.error != null -> LibraryError(uiState.error)
            else -> {
                PosterGrid {
                    items(uiState.items) { item ->
                        ModernMediaCard(
                            title = item.title,
                            posterUrl = org.knp.vortex.utils.formatImageUrl(item.poster_url, uiState.serverUrl)
                                ?: "${uiState.serverUrl.trimEnd('/')}/api/v1/media/${item.id}/thumbnail",
                            year = item.year,
                            onClick = { onPlayMedia(item.id, libraryType) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
