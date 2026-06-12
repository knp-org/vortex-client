package org.knp.vortex.ui.screens.book

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import org.knp.vortex.data.remote.MediaItemDto

import org.knp.vortex.data.repository.MediaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BookDetailUiState(
    val media: MediaItemDto? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class BookDetailViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookDetailUiState())
    val uiState: StateFlow<BookDetailUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(serverUrl = settingsRepository.getServerUrl())
    }

    fun loadMedia(id: Long) {
        if (_uiState.value.media?.id == id) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getMediaDetails(id)
                .onSuccess { media ->
                    _uiState.value = _uiState.value.copy(media = media, isLoading = false)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
                }
        }
    }
    fun refreshMetadata(id: Long) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.refreshMetadata(id)
                .onSuccess { media ->
                     _uiState.value = _uiState.value.copy(media = media, isLoading = false)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
                }
        }
    }
}
