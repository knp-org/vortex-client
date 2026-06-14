package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.CardDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.ModernMediaCard
import javax.inject.Inject

data class MusicVideoLibraryUiState(
    val isLoading: Boolean = true,
    val cards: List<CardDto> = emptyList(),
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class MusicVideoLibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {
    var uiState by mutableStateOf(MusicVideoLibraryUiState(serverUrl = settingsRepository.getServerUrl()))
        private set

    fun load(libId: Long) {
        if (uiState.cards.isNotEmpty()) return
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            repository.getLibraryCards(libId)
                .onSuccess { uiState = uiState.copy(isLoading = false, cards = it) }
                .onFailure { uiState = uiState.copy(isLoading = false, error = it.message) }
        }
    }
}

@Composable
fun MusicVideoLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onOpenCard: (CardDto) -> Unit,
    onBack: () -> Unit,
    viewModel: MusicVideoLibraryViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    LaunchedEffect(libraryId) { viewModel.load(libraryId) }

    LibraryScaffold(title = libraryDisplayTitle(libraryName, libraryType), onBack = onBack) {
        when {
            uiState.isLoading -> LibraryLoading()
            uiState.error != null -> LibraryError(uiState.error)
            else -> {
                // Music videos are landscape, so use a fixed 2-column grid with 16:9 cards.
                PosterGrid(fixedColumns = 2) {
                    items(uiState.cards) { card ->
                        ModernMediaCard(
                            title = card.title,
                            posterUrl = org.knp.vortex.utils.formatImageUrl(card.poster_url, uiState.serverUrl)
                                ?: "${uiState.serverUrl.trimEnd('/')}/api/v1/media/${card.id}/thumbnail",
                            year = card.year,
                            onClick = { onOpenCard(card) },
                            modifier = Modifier.fillMaxWidth(),
                            aspectRatio = 16f / 9f
                        )
                    }
                }
            }
        }
    }
}
