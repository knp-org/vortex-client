package org.knp.vortex.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.knp.vortex.data.repository.MediaRepository
import javax.inject.Inject

data class PlayerSettingsState(
    val defaultQuality: String = "original",
    val autoPlayNext: Boolean = true,
    val hardwareDecoding: Boolean = true,
    val subtitleSize: String = "medium",
    val skipIntro: Boolean = false,
    val skipForwardTime: Int = 10,
    val skipBackwardTime: Int = 10,
    val isLoading: Boolean = true,
    val error: String? = null,
    val isSaved: Boolean = false
)

@HiltViewModel
class PlayerSettingsViewModel @Inject constructor(
    private val mediaRepository: MediaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerSettingsState())
    val uiState: StateFlow<PlayerSettingsState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            mediaRepository.getSettings().fold(
                onSuccess = { settingsList ->
                    val playerSettings = settingsList.find { it.key == "player_settings" }
                    if (playerSettings != null) {
                        try {
                            val json = JSONObject(playerSettings.value)
                            _uiState.value = _uiState.value.copy(
                                defaultQuality = json.optString("defaultQuality", "original"),
                                autoPlayNext = json.optBoolean("autoPlayNext", true),
                                hardwareDecoding = json.optBoolean("hardwareDecoding", true),
                                subtitleSize = json.optString("subtitleSize", "medium"),
                                skipIntro = json.optBoolean("skipIntro", false),
                                skipForwardTime = json.optInt("skipForwardTime", 10),
                                skipBackwardTime = json.optInt("skipBackwardTime", 10)
                            )
                        } catch (e: Exception) {
                            _uiState.value = _uiState.value.copy(error = "Failed to parse player settings")
                        }
                    }
                    _uiState.value = _uiState.value.copy(isLoading = false)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.localizedMessage ?: "Failed to load settings"
                    )
                }
            )
        }
    }

    fun updateSetting(key: String, value: Any) {
        _uiState.value = when (key) {
            "defaultQuality" -> _uiState.value.copy(defaultQuality = value as String, isSaved = false)
            "autoPlayNext" -> _uiState.value.copy(autoPlayNext = value as Boolean, isSaved = false)
            "hardwareDecoding" -> _uiState.value.copy(hardwareDecoding = value as Boolean, isSaved = false)
            "subtitleSize" -> _uiState.value.copy(subtitleSize = value as String, isSaved = false)
            "skipIntro" -> _uiState.value.copy(skipIntro = value as Boolean, isSaved = false)
            "skipForwardTime" -> _uiState.value.copy(skipForwardTime = value as Int, isSaved = false)
            "skipBackwardTime" -> _uiState.value.copy(skipBackwardTime = value as Int, isSaved = false)
            else -> _uiState.value
        }
    }

    fun saveSettings() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val json = JSONObject().apply {
                put("defaultQuality", _uiState.value.defaultQuality)
                put("autoPlayNext", _uiState.value.autoPlayNext)
                put("hardwareDecoding", _uiState.value.hardwareDecoding)
                put("subtitleSize", _uiState.value.subtitleSize)
                put("skipIntro", _uiState.value.skipIntro)
                put("skipForwardTime", _uiState.value.skipForwardTime)
                put("skipBackwardTime", _uiState.value.skipBackwardTime)
            }
            mediaRepository.updateRemoteSetting("player_settings", json.toString()).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false, isSaved = true)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.localizedMessage ?: "Failed to save settings"
                    )
                }
            )
        }
    }
}
