package org.knp.vortex.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.PlaylistAdd
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.PlaylistDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.theme.DeepBackground
import javax.inject.Inject

data class AddToPlaylistUiState(
    val playlists: List<PlaylistDto> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class AddToPlaylistViewModel @Inject constructor(
    private val repository: MediaRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(AddToPlaylistUiState())
    val uiState: StateFlow<AddToPlaylistUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getPlaylists()
                .onSuccess { _uiState.value = _uiState.value.copy(playlists = it, isLoading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
        }
    }

    /** Adds every track in [trackIds] to [playlistId]; invokes [onDone] on success. */
    fun addToPlaylist(playlistId: Long, trackIds: List<Long>, onDone: () -> Unit) {
        viewModelScope.launch {
            for (trackId in trackIds) {
                val result = repository.addTrackToPlaylist(playlistId, trackId)
                if (result.isFailure) {
                    _uiState.value = _uiState.value.copy(error = result.exceptionOrNull()?.message)
                    return@launch
                }
            }
            onDone()
        }
    }

    /** Creates a playlist, adds every track in [trackIds] to it, then invokes [onDone]. */
    fun createAndAdd(name: String, trackIds: List<Long>, onDone: () -> Unit) {
        viewModelScope.launch {
            repository.createPlaylist(name)
                .onSuccess { playlist ->
                    for (trackId in trackIds) {
                        val result = repository.addTrackToPlaylist(playlist.id, trackId)
                        if (result.isFailure) {
                            _uiState.value = _uiState.value.copy(error = result.exceptionOrNull()?.message)
                            return@onSuccess
                        }
                    }
                    onDone()
                }
                .onFailure { _uiState.value = _uiState.value.copy(error = it.message) }
        }
    }
}

/**
 * Bottom sheet that lets the user add one or more [trackIds] to one of their playlists, or create a
 * new playlist on the spot. Shared by every track row (Songs list, album detail), the multi-select
 * action bar, and the music player.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddToPlaylistSheet(
    trackIds: List<Long>,
    onDismiss: () -> Unit,
    viewModel: AddToPlaylistViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var creating by remember { mutableStateOf(false) }
    var newName by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.load() }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = DeepBackground
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp)
        ) {
            Text(
                if (trackIds.size > 1) "Add ${trackIds.size} tracks to playlist" else "Add to playlist",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Create-new-playlist affordance / inline form.
            if (creating) {
                GlassyTextField(
                    value = newName,
                    onValueChange = { newName = it },
                    label = "Playlist name",
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                    TextButton(onClick = { creating = false; newName = "" }) {
                        Text("Cancel", color = Color.White.copy(alpha = 0.7f))
                    }
                    Spacer(Modifier.width(8.dp))
                    TextButton(
                        enabled = newName.isNotBlank(),
                        onClick = { viewModel.createAndAdd(newName.trim(), trackIds, onDismiss) }
                    ) {
                        Text("Create & add", color = if (newName.isNotBlank()) Color.White else Color.White.copy(alpha = 0.4f))
                    }
                }
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { creating = true }
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null, tint = Color.White)
                    Spacer(Modifier.width(16.dp))
                    Text("Create new playlist", color = Color.White, style = MaterialTheme.typography.bodyLarge)
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

            when {
                state.isLoading -> {
                    Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                }
                state.error != null -> {
                    Text(
                        state.error ?: "Error",
                        color = Color.Red,
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                }
                state.playlists.isEmpty() -> {
                    Text(
                        "No playlists yet. Create one above.",
                        color = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                }
                else -> {
                    LazyColumn(modifier = Modifier.heightIn(max = 360.dp)) {
                        items(state.playlists) { playlist ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { viewModel.addToPlaylist(playlist.id, trackIds, onDismiss) }
                                    .padding(vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.AutoMirrored.Filled.PlaylistAdd,
                                    contentDescription = null,
                                    tint = Color.White.copy(alpha = 0.7f)
                                )
                                Spacer(Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        playlist.name,
                                        color = Color.White,
                                        style = MaterialTheme.typography.bodyLarge
                                    )
                                    Text(
                                        "${playlist.track_count} tracks",
                                        color = Color.White.copy(alpha = 0.5f),
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Toolbar shown above a track list. Out of selection mode it offers a "Select" entry point; while
 * selecting it shows the count and drives select-all / bulk add / cancel. Shared by the Songs list
 * and album detail so multi-select behaves identically everywhere.
 */
@Composable
fun TrackSelectionBar(
    selectionMode: Boolean,
    selectedCount: Int,
    allSelected: Boolean,
    onEnterSelection: () -> Unit,
    onToggleAll: () -> Unit,
    onAdd: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (!selectionMode) {
            Spacer(Modifier.weight(1f))
            TextButton(onClick = onEnterSelection) {
                Icon(Icons.Filled.Checklist, contentDescription = null, tint = Color.White.copy(alpha = 0.8f), modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Select", color = Color.White.copy(alpha = 0.8f))
            }
        } else {
            TextButton(onClick = onToggleAll) {
                Text(if (allSelected) "Clear" else "All", color = Color.White.copy(alpha = 0.8f))
            }
            Text(
                "$selectedCount selected",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(Modifier.weight(1f))
            TextButton(enabled = selectedCount > 0, onClick = onAdd) {
                Icon(
                    Icons.AutoMirrored.Filled.PlaylistAdd,
                    contentDescription = null,
                    tint = if (selectedCount > 0) Color.White else Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text("Add", color = if (selectedCount > 0) Color.White else Color.White.copy(alpha = 0.4f))
            }
            IconButton(onClick = onCancel) {
                Icon(Icons.Filled.Close, contentDescription = "Cancel", tint = Color.White.copy(alpha = 0.8f))
            }
        }
    }
}
