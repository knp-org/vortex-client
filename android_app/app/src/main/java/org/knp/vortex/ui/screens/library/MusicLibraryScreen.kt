package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.PlaylistAdd
import androidx.compose.material.icons.automirrored.filled.QueueMusic
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.CardDto
import org.knp.vortex.data.remote.PlaylistDto
import org.knp.vortex.data.remote.TrackDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.ModernMediaCard
import org.knp.vortex.ui.theme.DeepBackground
import javax.inject.Inject

// Music libraries can be browsed as Artists (grid), a flat Songs list, or the user's Playlists.
enum class MusicView {
    ARTISTS, SONGS, PLAYLISTS
}

data class MusicLibraryUiState(
    val isLoading: Boolean = true,
    val artists: List<CardDto> = emptyList(),
    val tracks: List<TrackDto> = emptyList(),
    val playlists: List<PlaylistDto> = emptyList(),
    val error: String? = null,
    val serverUrl: String = "",
    val musicView: MusicView = MusicView.ARTISTS,
    val songsLoading: Boolean = false,
    val playlistsLoading: Boolean = false
)

@HiltViewModel
class MusicLibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository,
    private val musicQueue: org.knp.vortex.data.player.MusicQueue
) : ViewModel() {
    var uiState by mutableStateOf(MusicLibraryUiState(serverUrl = settingsRepository.getServerUrl()))
        private set

    fun load(libId: Long) {
        if (uiState.artists.isNotEmpty()) return
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            repository.getArtists(libId)
                .onSuccess { uiState = uiState.copy(isLoading = false, artists = it) }
                .onFailure { uiState = uiState.copy(isLoading = false, error = it.message) }
        }
    }

    fun setMusicView(view: MusicView, libId: Long) {
        if (uiState.musicView == view) return
        uiState = uiState.copy(musicView = view)
        if (view == MusicView.SONGS && uiState.tracks.isEmpty()) {
            loadSongs(libId)
        } else if (view == MusicView.PLAYLISTS) {
            loadPlaylists()
        }
    }

    private fun loadSongs(libId: Long) {
        viewModelScope.launch {
            uiState = uiState.copy(songsLoading = true, error = null)
            repository.getLibraryTracks(libId).onSuccess { tracks ->
                // Flat "Songs" view is ordered by track name.
                uiState = uiState.copy(songsLoading = false, tracks = tracks.sortedBy { (it.title ?: "").lowercase() })
            }.onFailure { uiState = uiState.copy(songsLoading = false, error = it.message) }
        }
    }

    fun loadPlaylists() {
        viewModelScope.launch {
            uiState = uiState.copy(playlistsLoading = true, error = null)
            repository.getPlaylists()
                .onSuccess { uiState = uiState.copy(playlistsLoading = false, playlists = it) }
                .onFailure { uiState = uiState.copy(playlistsLoading = false, error = it.message) }
        }
    }

    fun createPlaylist(name: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            repository.createPlaylist(name.trim())
                .onSuccess { loadPlaylists() }
                .onFailure { uiState = uiState.copy(error = it.message) }
        }
    }

    /** Loads the tapped song (and the rest of the list) into the shared player queue. */
    fun playSong(index: Int, libraryName: String) {
        musicQueue.set(uiState.tracks, index, title = libraryName.ifBlank { "Songs" })
    }
}

@Composable
fun MusicLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onOpenCard: (CardDto) -> Unit,
    onPlaySong: () -> Unit,
    onOpenPlaylist: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: MusicLibraryViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    val displayTitle = libraryDisplayTitle(libraryName, libraryType)

    LaunchedEffect(libraryId) { viewModel.load(libraryId) }

    // Tracks queued for the add-to-playlist bottom sheet; non-null/non-empty shows it.
    // Holds a single id for a row's "+" tap, or many ids for a multi-select bulk add.
    var addToPlaylistTrackIds by remember { mutableStateOf<List<Long>?>(null) }
    // Multi-select state for the Songs list.
    var selectionMode by remember { mutableStateOf(false) }
    var selectedIds by remember { mutableStateOf<Set<Long>>(emptySet()) }
    val exitSelection = { selectionMode = false; selectedIds = emptySet() }
    // Whether the "create playlist" dialog is open (Playlists tab).
    var showCreatePlaylist by remember { mutableStateOf(false) }
    var newPlaylistName by remember { mutableStateOf("") }

    val dialogs: @Composable () -> Unit = {
        AddToPlaylistAndCreateDialogs(
            addToPlaylistTrackIds = addToPlaylistTrackIds,
            onDismissSheet = { addToPlaylistTrackIds = null; if (selectionMode) exitSelection() },
            showCreatePlaylist = showCreatePlaylist,
            newPlaylistName = newPlaylistName,
            onNameChange = { newPlaylistName = it },
            onCancelCreate = { showCreatePlaylist = false; newPlaylistName = "" },
            onConfirmCreate = {
                viewModel.createPlaylist(newPlaylistName)
                showCreatePlaylist = false
                newPlaylistName = ""
            }
        )
    }

    LibraryScaffold(title = displayTitle, onBack = onBack) {
        MusicViewToggle(
            selected = uiState.musicView,
            onSelect = { viewModel.setMusicView(it, libraryId) },
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        when (uiState.musicView) {
            MusicView.SONGS -> {
                when {
                    uiState.songsLoading -> LibraryLoading()
                    uiState.tracks.isEmpty() -> LibraryEmpty("No songs in this library.")
                    else -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            org.knp.vortex.ui.components.TrackSelectionBar(
                                selectionMode = selectionMode,
                                selectedCount = selectedIds.size,
                                allSelected = selectedIds.size == uiState.tracks.size && uiState.tracks.isNotEmpty(),
                                onEnterSelection = { selectionMode = true },
                                onToggleAll = {
                                    selectedIds = if (selectedIds.size == uiState.tracks.size) emptySet()
                                    else uiState.tracks.map { it.id }.toSet()
                                },
                                onAdd = { addToPlaylistTrackIds = selectedIds.toList() },
                                onCancel = exitSelection
                            )
                            LazyColumn(
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                itemsIndexed(uiState.tracks) { index, track ->
                                    SongRow(
                                        track = track,
                                        serverUrl = uiState.serverUrl,
                                        selectionMode = selectionMode,
                                        selected = track.id in selectedIds,
                                        onClick = {
                                            if (selectionMode) {
                                                selectedIds = if (track.id in selectedIds) selectedIds - track.id
                                                else selectedIds + track.id
                                            } else {
                                                viewModel.playSong(index, displayTitle)
                                                onPlaySong()
                                            }
                                        },
                                        onAddToPlaylist = { addToPlaylistTrackIds = listOf(track.id) }
                                    )
                                }
                            }
                        }
                    }
                }
                dialogs()
            }

            MusicView.PLAYLISTS -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showCreatePlaylist = true }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, tint = Color.White)
                        Spacer(Modifier.width(12.dp))
                        Text("New Playlist", color = Color.White, style = MaterialTheme.typography.bodyLarge)
                    }
                    when {
                        uiState.playlistsLoading -> LibraryLoading()
                        uiState.playlists.isEmpty() -> LibraryEmpty("No playlists yet.")
                        else -> {
                            LazyColumn(
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                itemsIndexed(uiState.playlists) { _, playlist ->
                                    PlaylistRow(playlist = playlist, onClick = { onOpenPlaylist(playlist.id) })
                                }
                            }
                        }
                    }
                }
                dialogs()
            }

            MusicView.ARTISTS -> {
                when {
                    uiState.isLoading -> LibraryLoading()
                    uiState.error != null -> LibraryError(uiState.error)
                    else -> {
                        PosterGrid {
                            items(uiState.artists) { card ->
                                ModernMediaCard(
                                    title = card.title,
                                    posterUrl = org.knp.vortex.utils.formatImageUrl(card.poster_url, uiState.serverUrl)
                                        ?: if (card.kind == "artist" || card.kind == "album") null else "${uiState.serverUrl.trimEnd('/')}/api/v1/media/${card.id}/thumbnail",
                                    year = card.year,
                                    onClick = { onOpenCard(card) },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MusicViewToggle(
    selected: MusicView,
    onSelect: (MusicView) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        MusicViewTab("Artists", selected == MusicView.ARTISTS) { onSelect(MusicView.ARTISTS) }
        MusicViewTab("Songs", selected == MusicView.SONGS) { onSelect(MusicView.SONGS) }
        MusicViewTab("Playlists", selected == MusicView.PLAYLISTS) { onSelect(MusicView.PLAYLISTS) }
    }
}

@Composable
private fun MusicViewTab(label: String, active: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (active) Color.White.copy(alpha = 0.12f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp)
    ) {
        Text(
            text = label,
            color = if (active) Color.White else Color.White.copy(alpha = 0.7f),
            fontWeight = if (active) FontWeight.SemiBold else FontWeight.Normal,
            style = MaterialTheme.typography.labelLarge
        )
    }
}

@Composable
private fun SongRow(
    track: TrackDto,
    serverUrl: String,
    selectionMode: Boolean,
    selected: Boolean,
    onClick: () -> Unit,
    onAddToPlaylist: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (selectionMode) {
            Checkbox(
                checked = selected,
                onCheckedChange = { onClick() },
                colors = CheckboxDefaults.colors(
                    checkedColor = Color.White,
                    uncheckedColor = Color.White.copy(alpha = 0.5f),
                    checkmarkColor = DeepBackground
                )
            )
            Spacer(Modifier.width(4.dp))
        }
        val cover = org.knp.vortex.utils.formatImageUrl(track.cover_url, serverUrl)
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(Color.White.copy(alpha = 0.06f)),
            contentAlignment = Alignment.Center
        ) {
            if (cover != null) {
                AsyncImage(
                    model = cover,
                    contentDescription = track.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Icon(
                    Icons.Filled.MusicNote,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.size(22.dp)
                )
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title ?: "Unknown",
                color = Color.White,
                style = MaterialTheme.typography.bodyLarge,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            val subtitle = listOfNotNull(track.artist, track.album).joinToString(" • ")
            if (subtitle.isNotBlank()) {
                Text(
                    text = subtitle,
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        val dur = formatSongDuration(track.duration)
        if (dur.isNotBlank()) {
            Spacer(Modifier.width(8.dp))
            Text(dur, color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelSmall)
        }
        if (!selectionMode) {
            IconButton(onClick = onAddToPlaylist) {
                Icon(
                    Icons.AutoMirrored.Filled.PlaylistAdd,
                    contentDescription = "Add to playlist",
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
private fun PlaylistRow(
    playlist: PlaylistDto,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(Color.White.copy(alpha = 0.06f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.AutoMirrored.Filled.QueueMusic,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.5f),
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = playlist.name,
                color = Color.White,
                style = MaterialTheme.typography.bodyLarge,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${playlist.track_count} tracks",
                color = Color.White.copy(alpha = 0.6f),
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

/** Shared rendering of the add-to-playlist bottom sheet and the create-playlist dialog. */
@Composable
private fun AddToPlaylistAndCreateDialogs(
    addToPlaylistTrackIds: List<Long>?,
    onDismissSheet: () -> Unit,
    showCreatePlaylist: Boolean,
    newPlaylistName: String,
    onNameChange: (String) -> Unit,
    onCancelCreate: () -> Unit,
    onConfirmCreate: () -> Unit
) {
    if (!addToPlaylistTrackIds.isNullOrEmpty()) {
        org.knp.vortex.ui.components.AddToPlaylistSheet(
            trackIds = addToPlaylistTrackIds,
            onDismiss = onDismissSheet
        )
    }
    if (showCreatePlaylist) {
        org.knp.vortex.ui.components.GlassyDialog(
            onDismissRequest = onCancelCreate,
            title = "New Playlist",
            content = {
                org.knp.vortex.ui.components.GlassyTextField(
                    value = newPlaylistName,
                    onValueChange = onNameChange,
                    label = "Playlist name",
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(enabled = newPlaylistName.isNotBlank(), onClick = onConfirmCreate) {
                    Text("Create", color = if (newPlaylistName.isNotBlank()) Color.White else Color.White.copy(alpha = 0.4f))
                }
            },
            dismissButton = {
                TextButton(onClick = onCancelCreate) {
                    Text("Cancel", color = Color.White.copy(alpha = 0.7f))
                }
            }
        )
    }
}

private fun formatSongDuration(seconds: Long?): String {
    if (seconds == null || seconds <= 0) return ""
    val m = seconds / 60
    val s = seconds % 60
    return "%d:%02d".format(m, s)
}
