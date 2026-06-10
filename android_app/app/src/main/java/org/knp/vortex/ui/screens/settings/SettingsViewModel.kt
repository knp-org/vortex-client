package org.knp.vortex.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import org.knp.vortex.data.remote.LibraryDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import org.knp.vortex.data.remote.ProviderInfoDto

data class SettingsUiState(
    val serverUrl: String = "",
    val isBiometricEnabled: Boolean = false,
    val isLoading: Boolean = false,
    val isSaved: Boolean = false,
    val error: String? = null,
    val providers: List<ProviderInfoDto> = emptyList()
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val mediaRepository: MediaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
        loadRemoteSettings()
        loadProviders()
    }

    private fun loadSettings() {
        val currentUrl = settingsRepository.getServerUrl()
        val biometric = settingsRepository.isBiometricEnabled()
        
        _uiState.value = _uiState.value.copy(
            serverUrl = currentUrl,
            isBiometricEnabled = biometric
        )
    }

    private fun loadRemoteSettings() {
        viewModelScope.launch {
            mediaRepository.getSettings().onSuccess { settingsList ->
                // Legacy setting loading removed
            }
        }
    }
    
    fun updateServerUrl(url: String) {
        _uiState.value = _uiState.value.copy(serverUrl = url, isSaved = false)
    }
    
    fun toggleBiometric(enabled: Boolean) {
        settingsRepository.setBiometricEnabled(enabled)
        _uiState.value = _uiState.value.copy(isBiometricEnabled = enabled)
    }

    fun saveSettings() {
        viewModelScope.launch {
            settingsRepository.setServerUrl(_uiState.value.serverUrl)
            _uiState.value = _uiState.value.copy(isSaved = true)
        }
    }
    
    fun resetToDefault() {
        val defaultUrl = settingsRepository.getDefaultUrl()
        _uiState.value = _uiState.value.copy(serverUrl = defaultUrl, isSaved = false)
    }
    
    fun resetDatabase() {
        viewModelScope.launch {
            mediaRepository.resetDatabase()
        }
    }

    fun scanLibraries() {
        viewModelScope.launch {
            mediaRepository.scanLibraries()
        }
    }

    fun logout() {
        settingsRepository.setAuthToken(null)
    }

    private fun loadProviders() {
        viewModelScope.launch {
            mediaRepository.getProviders().onSuccess { providers ->
                _uiState.value = _uiState.value.copy(providers = providers)
            }
        }
    }

    fun toggleProvider(id: String, enabled: Boolean) {
        viewModelScope.launch {
            mediaRepository.toggleProvider(id, enabled).onSuccess {
                loadProviders() // Refresh the list
            }
        }
    }

    fun moveProviderUp(id: String) {
        val currentOrder = _uiState.value.providers.map { it.id }.toMutableList()
        val index = currentOrder.indexOf(id)
        if (index > 0) {
            val temp = currentOrder[index - 1]
            currentOrder[index - 1] = currentOrder[index]
            currentOrder[index] = temp
            saveProviderOrder(currentOrder)
        }
    }

    fun moveProviderDown(id: String) {
        val currentOrder = _uiState.value.providers.map { it.id }.toMutableList()
        val index = currentOrder.indexOf(id)
        if (index >= 0 && index < currentOrder.size - 1) {
            val temp = currentOrder[index + 1]
            currentOrder[index + 1] = currentOrder[index]
            currentOrder[index] = temp
            saveProviderOrder(currentOrder)
        }
    }

    private fun saveProviderOrder(order: List<String>) {
        viewModelScope.launch {
            mediaRepository.reorderProviders(order).onSuccess {
                loadProviders()
            }
        }
    }

    suspend fun getProviderConfig(id: String): Map<String, Any>? {
        return mediaRepository.getProviderConfig(id).getOrNull()?.config
    }

    fun updateProviderConfig(id: String, config: Map<String, Any>) {
        viewModelScope.launch {
            mediaRepository.updateProviderConfig(id, config).onSuccess {
                loadProviders()
            }
        }
    }
}
