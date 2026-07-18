package org.knp.vortex.ui.screens.comic

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import org.knp.vortex.data.remote.SeriesDetailDto
import org.knp.vortex.data.remote.EpisodeDto
import org.knp.vortex.data.repository.MediaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class ComicSortOrder {
    NUMBER_ASC, NUMBER_DESC, NAME_ASC, NAME_DESC
}

data class ComicSeriesUiState(
    val seriesDetail: SeriesDetailDto? = null,
    val chapters: List<EpisodeDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val serverUrl: String = "",
    val sortOrder: ComicSortOrder = ComicSortOrder.NUMBER_ASC
)

@HiltViewModel
class ComicSeriesViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(ComicSeriesUiState(serverUrl = settingsRepository.getServerUrl()))
    val uiState: StateFlow<ComicSeriesUiState> = _uiState.asStateFlow()

    private val seriesId: Long = savedStateHandle.get<Long>("seriesId") ?: 0L

    init {
        loadSeriesDetail()
    }

    fun loadSeriesDetail() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getBookSeriesDetail(seriesId)
                .onSuccess { detail ->
                    repository.getBookSeriesChapters(seriesId)
                        .onSuccess { eps ->
                            _uiState.value = _uiState.value.copy(
                                seriesDetail = detail,
                                chapters = sortChapters(eps, _uiState.value.sortOrder),
                                isLoading = false
                            )
                        }
                        .onFailure {
                            _uiState.value = _uiState.value.copy(
                                seriesDetail = detail,
                                isLoading = false,
                                error = "Failed to load chapters"
                            )
                        }
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
                }
        }
    }

    fun toggleSortOrder() {
        val currentOrder = _uiState.value.sortOrder
        val newOrder = when (currentOrder) {
            ComicSortOrder.NUMBER_ASC -> ComicSortOrder.NUMBER_DESC
            ComicSortOrder.NUMBER_DESC -> ComicSortOrder.NAME_ASC
            ComicSortOrder.NAME_ASC -> ComicSortOrder.NAME_DESC
            ComicSortOrder.NAME_DESC -> ComicSortOrder.NUMBER_ASC
        }
        _uiState.value = _uiState.value.copy(
            sortOrder = newOrder,
            chapters = sortChapters(_uiState.value.chapters, newOrder)
        )
    }

    private fun sortChapters(chapters: List<EpisodeDto>, order: ComicSortOrder): List<EpisodeDto> {
        val byTitle = Comparator<EpisodeDto> { a, b -> naturalCompare(a.title ?: "", b.title ?: "") }
        val byNumber = compareBy<EpisodeDto> { it.episode_number }.then(byTitle)
        return when (order) {
            ComicSortOrder.NUMBER_ASC -> chapters.sortedWith(byNumber)
            ComicSortOrder.NUMBER_DESC -> chapters.sortedWith(byNumber.reversed())
            ComicSortOrder.NAME_ASC -> chapters.sortedWith(byTitle)
            ComicSortOrder.NAME_DESC -> chapters.sortedWith(byTitle.reversed())
        }
    }

    /** Compares strings so embedded numbers sort numerically ("Chapter 2" < "Chapter 10"). */
    private fun naturalCompare(a: String, b: String): Int {
        var i = 0
        var j = 0
        while (i < a.length && j < b.length) {
            if (a[i].isDigit() && b[j].isDigit()) {
                var i2 = i
                while (i2 < a.length && a[i2].isDigit()) i2++
                var j2 = j
                while (j2 < b.length && b[j2].isDigit()) j2++
                val na = a.substring(i, i2).trimStart('0')
                val nb = b.substring(j, j2).trimStart('0')
                val cmp = if (na.length != nb.length) na.length - nb.length else na.compareTo(nb)
                if (cmp != 0) return cmp
                i = i2
                j = j2
            } else {
                val cmp = a[i].lowercaseChar().compareTo(b[j].lowercaseChar())
                if (cmp != 0) return cmp
                i++
                j++
            }
        }
        return (a.length - i) - (b.length - j)
    }
}
