package org.knp.vortex.ui.screens.library

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import org.knp.vortex.data.repository.MediaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ManageLibraryUiState(
    val isScanning: Boolean = false,
    val isRefreshing: Boolean = false,
    val message: String? = null,
    val error: String? = null
)

/** Scan / refresh actions for a single library. */
@HiltViewModel
class ManageLibraryViewModel @Inject constructor(
    private val mediaRepository: MediaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ManageLibraryUiState())
    val uiState: StateFlow<ManageLibraryUiState> = _uiState.asStateFlow()

    fun scan(id: Long) {
        if (_uiState.value.isScanning || _uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isScanning = true, message = null, error = null)
            mediaRepository.scanLibrary(id).onSuccess {
                _uiState.value = _uiState.value.copy(
                    isScanning = false,
                    message = "Scan started. New files will appear once processed."
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(isScanning = false, error = "Scan failed: ${e.message}")
            }
        }
    }

    fun refresh(id: Long) {
        if (_uiState.value.isScanning || _uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true, message = null, error = null)
            mediaRepository.refreshLibrary(id).onSuccess {
                _uiState.value = _uiState.value.copy(
                    isRefreshing = false,
                    message = "Metadata refresh started. This may take a while."
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(isRefreshing = false, error = "Refresh failed: ${e.message}")
            }
        }
    }
}
