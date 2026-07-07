package org.knp.vortex.ui.screens.gallery

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.GalleryDetailDto
import org.knp.vortex.data.remote.ImageDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.data.repository.SettingsRepository
import javax.inject.Inject

data class GalleryDetailUiState(
    val gallery: GalleryDetailDto? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class GalleryDetailViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: SettingsRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(GalleryDetailUiState(serverUrl = settingsRepository.getServerUrl()))
    val uiState: StateFlow<GalleryDetailUiState> = _uiState.asStateFlow()

    private val galleryId: Long = savedStateHandle.get<Long>("galleryId") ?: 0L

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getGalleryDetail(galleryId)
                .onSuccess { _uiState.value = _uiState.value.copy(isLoading = false, gallery = it) }
                .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
        }
    }

    /** Absolute URL for the full-size photo; the endpoint is protected, so carry the token. */
    fun fullImageUrl(image: ImageDto): String {
        val base = _uiState.value.serverUrl.trimEnd('/')
        val token = settingsRepository.getAuthToken()
        val tq = if (token != null) "?token=$token" else ""
        return "$base${image.url}$tq"
    }
}
