package org.knp.vortex.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.MediaItemDto
import org.knp.vortex.data.remote.SeriesDto
import org.knp.vortex.data.repository.MediaRepository
import javax.inject.Inject

data class SearchUiState(
    val query: String = "",
    val isLoading: Boolean = false,
    val movies: List<MediaItemDto> = emptyList(),
    val series: List<SeriesDto> = emptyList(),
    val error: String? = null,
    val serverUrl: String = ""
)

@OptIn(FlowPreview::class)
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState(serverUrl = settingsRepository.getServerUrl()))
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    init {
        // Search runs entirely on the server (`/library/search`), which matches
        // across all library types except the hidden `other` type and groups
        // comics/series into a single entity. Debounced so we don't hit the API
        // on every keystroke.
        viewModelScope.launch {
            queryFlow
                .debounce(300)
                .distinctUntilChanged()
                .collectLatest { query -> runSearch(query) }
        }
    }

    fun onQueryChange(query: String) {
        _uiState.update { it.copy(query = query) }
        queryFlow.value = query
    }

    private suspend fun runSearch(query: String) {
        if (query.isBlank()) {
            _uiState.update { it.copy(movies = emptyList(), series = emptyList(), isLoading = false) }
            return
        }

        _uiState.update { it.copy(isLoading = true) }

        val results = repository.searchLibrary(query, null).getOrDefault(emptyList())
        // The server tags grouped series rows with media_type == "series".
        val series = results
            .filter { it.media_type == "series" }
            .map { SeriesDto(name = it.series_name ?: it.title ?: "", poster_url = it.poster_url, season_count = 0) }
        val movies = results.filter { it.media_type != "series" }

        _uiState.update { it.copy(movies = movies, series = series, isLoading = false) }
    }
}
