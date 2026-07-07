package org.knp.vortex.ui.screens.library

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SortByAlpha
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.SeriesDto
import org.knp.vortex.data.repository.MediaRepository
import javax.inject.Inject

data class SeriesLibraryUiState(
    val isLoading: Boolean = true,
    val series: List<SeriesDto> = emptyList(),
    val error: String? = null,
    val serverUrl: String = "",
    val sortOrder: SortOrder = SortOrder.NAME_ASC
)

@HiltViewModel
class SeriesLibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {
    var uiState by mutableStateOf(SeriesLibraryUiState(serverUrl = settingsRepository.getServerUrl()))
        private set

    fun load(libId: Long, libType: String) {
        if (uiState.series.isNotEmpty()) return
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            val result = if (libType.lowercase() == "books") {
                // Book libraries return CardDto which maps to SeriesDto format
                repository.getLibraryCards(libId).map { cards ->
                    cards.map { org.knp.vortex.data.remote.SeriesDto(id = it.id, name = it.title ?: "", poster_url = it.poster_url, season_count = 0) }
                }
            } else {
                repository.getSeries(libId)
            }
            result
                .onSuccess { uiState = uiState.copy(isLoading = false, series = sortSeries(it, uiState.sortOrder)) }
                .onFailure { uiState = uiState.copy(isLoading = false, error = it.message) }
        }
    }

    fun toggleSortOrder() {
        val newOrder = if (uiState.sortOrder == SortOrder.NAME_ASC) SortOrder.NAME_DESC else SortOrder.NAME_ASC
        uiState = uiState.copy(sortOrder = newOrder, series = sortSeries(uiState.series, newOrder))
    }
}

/**
 * TV-show and Book (comic) libraries both render a sortable grid of series posters; the caller
 * decides where a tapped series navigates (TV detail vs. comic series). [SeriesLibraryScreen]
 * serves TV shows; [BookLibraryScreen] serves books — both reuse [SeriesLibraryContent].
 */
@Composable
fun SeriesLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onOpenSeries: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: SeriesLibraryViewModel = hiltViewModel()
) {
    SeriesLibraryContent(libraryId, libraryName, libraryType, onOpenSeries, onBack, viewModel)
}

@Composable
fun SeriesLibraryContent(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onOpenSeries: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: SeriesLibraryViewModel
) {
    val uiState = viewModel.uiState
    LaunchedEffect(libraryId) { viewModel.load(libraryId, libraryType) }

    LibraryScaffold(
        title = libraryDisplayTitle(libraryName, libraryType),
        onBack = onBack,
        actions = {
            IconButton(onClick = { viewModel.toggleSortOrder() }) {
                Icon(Icons.Filled.SortByAlpha, contentDescription = "Sort", tint = Color.White)
            }
        }
    ) {
        when {
            uiState.isLoading -> LibraryLoading()
            uiState.error != null -> LibraryError(uiState.error)
            else -> SeriesGrid(series = uiState.series, serverUrl = uiState.serverUrl, onOpen = onOpenSeries)
        }
    }
}
