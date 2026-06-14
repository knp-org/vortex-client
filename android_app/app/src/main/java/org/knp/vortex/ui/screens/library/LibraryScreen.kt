package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.data.remote.FileSystemEntryDto
import androidx.activity.compose.BackHandler
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.launch
import coil.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.Brush
import org.knp.vortex.data.remote.MediaItemDto
import org.knp.vortex.data.remote.SeriesDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.AppHeader
import org.knp.vortex.ui.components.ModernMediaCard
import org.knp.vortex.ui.components.SectionHeader
import org.knp.vortex.ui.theme.DeepBackground
import org.knp.vortex.ui.theme.PrimaryBlue
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import androidx.compose.material.icons.filled.SortByAlpha
import androidx.compose.material.icons.Icons

enum class SortOrder {
    NAME_ASC, NAME_DESC
}

// Music libraries can be browsed as Artists (grid) or as a flat Songs list.
enum class MusicView {
    ARTISTS, SONGS
}

data class LibraryUiState(
    val isLoading: Boolean = true,
    val mediaItems: List<MediaItemDto> = emptyList(),
    val seriesList: List<SeriesDto> = emptyList(),
    val cards: List<org.knp.vortex.data.remote.CardDto> = emptyList(),
    val tracks: List<org.knp.vortex.data.remote.TrackDto> = emptyList(),
    val fileSystemEntries: List<FileSystemEntryDto> = emptyList(),
    val currentPath: String = "",
    val error: String? = null,
    val serverUrl: String = "",
    val sortOrder: SortOrder = SortOrder.NAME_ASC,
    val musicView: MusicView = MusicView.ARTISTS,
    val songsLoading: Boolean = false
)

@HiltViewModel
class LibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository,
    private val musicQueue: org.knp.vortex.data.player.MusicQueue
) : ViewModel() {
    var uiState by mutableStateOf(LibraryUiState())
        private set

    init {
        uiState = uiState.copy(serverUrl = settingsRepository.getServerUrl())
    }

    fun loadLibraryContent(libId: Long, libraryType: String) {
        if (uiState.mediaItems.isNotEmpty() || uiState.seriesList.isNotEmpty() || uiState.cards.isNotEmpty() || uiState.fileSystemEntries.isNotEmpty()) return // Already loaded

        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)

            val type = libraryType.lowercase()
            when {
                type == "tv_shows" || type == "books" -> {
                    repository.getSeries(libId).onSuccess { series ->
                        val sorted = sortSeries(series, uiState.sortOrder)
                        uiState = uiState.copy(isLoading = false, seriesList = sorted)
                    }.onFailure { error -> uiState = uiState.copy(isLoading = false, error = error.message) }
                }
                type == "music" -> {
                    // Music libraries browse Artists -> Albums -> Tracks.
                    repository.getArtists(libId).onSuccess { cards ->
                        uiState = uiState.copy(isLoading = false, cards = cards)
                    }.onFailure { error -> uiState = uiState.copy(isLoading = false, error = error.message) }
                }
                type == "music_videos" -> {
                    repository.getLibraryCards(libId).onSuccess { cards ->
                        uiState = uiState.copy(isLoading = false, cards = cards)
                    }.onFailure { error -> uiState = uiState.copy(isLoading = false, error = error.message) }
                }
                type == "other" -> {
                    browse(libId, "")
                }
                else -> {
                    repository.getLibraryMedia(libId).onSuccess { items ->
                        uiState = uiState.copy(isLoading = false, mediaItems = items)
                    }.onFailure { error -> uiState = uiState.copy(isLoading = false, error = error.message) }
                }
            }
        }
    }

    fun browse(libId: Long, path: String) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            repository.browseLibrary(libId, path).onSuccess { entries ->
                 uiState = uiState.copy(
                     isLoading = false, 
                     fileSystemEntries = entries,
                     currentPath = path
                 )
            }.onFailure { error ->
                 uiState = uiState.copy(isLoading = false, error = error.message)
            }
        }
    }

    fun goUp(libId: Long) {
        val current = uiState.currentPath
        if (current.isEmpty()) return
        
        // Remove last segment
        val parts = current.split("/").filter { it.isNotEmpty() }
        val newPath = if (parts.size <= 1) "" else parts.dropLast(1).joinToString("/")
        browse(libId, newPath)
    }

    fun setMusicView(view: MusicView, libId: Long) {
        if (uiState.musicView == view) return
        uiState = uiState.copy(musicView = view)
        if (view == MusicView.SONGS && uiState.tracks.isEmpty()) {
            loadSongs(libId)
        }
    }

    private fun loadSongs(libId: Long) {
        viewModelScope.launch {
            uiState = uiState.copy(songsLoading = true, error = null)
            repository.getLibraryTracks(libId).onSuccess { tracks ->
                // Flat "Songs" view is ordered by track name.
                val sorted = tracks.sortedBy { (it.title ?: "").lowercase() }
                uiState = uiState.copy(songsLoading = false, tracks = sorted)
            }.onFailure { error ->
                uiState = uiState.copy(songsLoading = false, error = error.message)
            }
        }
    }

    /** Loads the tapped song (and the rest of the list) into the shared player queue. */
    fun playSong(index: Int, libraryName: String) {
        musicQueue.set(uiState.tracks, index, title = libraryName.ifBlank { "Songs" })
    }

    fun toggleSortOrder() {
        val newOrder = if (uiState.sortOrder == SortOrder.NAME_ASC) SortOrder.NAME_DESC else SortOrder.NAME_ASC
        uiState = uiState.copy(
            sortOrder = newOrder,
            seriesList = sortSeries(uiState.seriesList, newOrder)
        )
    }

    private fun sortSeries(series: List<SeriesDto>, order: SortOrder): List<SeriesDto> {
        return when (order) {
            SortOrder.NAME_ASC -> series.sortedBy { it.name.lowercase() }
            SortOrder.NAME_DESC -> series.sortedByDescending { it.name.lowercase() }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onPlayMedia: (Long, String?) -> Unit,
    onOpenSeries: (Long, String) -> Unit,
    onOpenCard: (org.knp.vortex.data.remote.CardDto) -> Unit,
    onPlaySong: () -> Unit,
    onBack: () -> Unit,
    viewModel: LibraryViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    val displayTitle = libraryName.ifBlank {
        libraryType.replace("_", " ").split(" ").joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
    }
    
    LaunchedEffect(libraryId, libraryType) {
        viewModel.loadLibraryContent(libraryId, libraryType)
    }

    // Handle Back Press for browsing
    BackHandler(enabled = uiState.currentPath.isNotEmpty()) {
        viewModel.goUp(libraryId)
    }

    // Override generic back actions if searching
    val effectiveOnBack = {
        if (uiState.currentPath.isNotEmpty()) {
            viewModel.goUp(libraryId)
        } else {
            onBack()
        }
    }

    org.knp.vortex.ui.components.GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                AppHeader(
                    title = displayTitle,
                    onBack = effectiveOnBack,
                    actions = {
                        if (libraryType == "tv_shows" || libraryType == "books") {
                            IconButton(onClick = { viewModel.toggleSortOrder() }) {
                                Icon(
                                    imageVector = Icons.Filled.SortByAlpha,
                                    contentDescription = "Sort",
                                    tint = Color.White
                                )
                            }
                        }
                    }
                )
            }
        ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Directory Path Header (Only shown when browsing subdirectories)
            if (uiState.currentPath.isNotEmpty()) {
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    SectionHeader(title = "... / ${uiState.currentPath.substringAfterLast('/')}")
                }
            }

            // Music libraries can switch between the Artists grid and a flat Songs list.
            val isMusic = libraryType.lowercase() == "music"
            if (isMusic) {
                MusicViewToggle(
                    selected = uiState.musicView,
                    onSelect = { viewModel.setMusicView(it, libraryId) },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // Render the flat Songs list for music libraries when selected.
            if (isMusic && uiState.musicView == MusicView.SONGS) {
                when {
                    uiState.songsLoading -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Color.White)
                        }
                    }
                    uiState.tracks.isEmpty() -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No songs in this library.", color = Color.White.copy(alpha = 0.6f))
                        }
                    }
                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            itemsIndexed(uiState.tracks) { index, track ->
                                SongRow(
                                    track = track,
                                    serverUrl = uiState.serverUrl,
                                    onClick = {
                                        viewModel.playSong(index, displayTitle)
                                        onPlaySong()
                                    }
                                )
                            }
                        }
                    }
                }
                return@Column
            }

            when {
                uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                }
                uiState.error != null -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = uiState.error, color = Color.Red)
                    }
                }
                else -> {
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = 120.dp),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        if (libraryType == "tv_shows" || libraryType == "books") {
                            items(uiState.seriesList) { series ->
                                ModernMediaCard(
                                    title = series.name,
                                    posterUrl = org.knp.vortex.utils.formatImageUrl(series.poster_url, uiState.serverUrl),
                                    year = null,
                                    onClick = { onOpenSeries(series.id, libraryType) },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        } else if (libraryType.lowercase().let { it == "music" || it == "music_videos" }) {
                            items(uiState.cards) { card ->
                                ModernMediaCard(
                                    title = card.title,
                                    posterUrl = org.knp.vortex.utils.formatImageUrl(card.poster_url, uiState.serverUrl)
                                        ?: "${uiState.serverUrl.trimEnd('/')}/api/v1/media/${card.id}/thumbnail",
                                    year = card.year,
                                    onClick = { onOpenCard(card) },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        } else if (libraryType.lowercase() == "other") {
                            items(uiState.fileSystemEntries) { entry ->
                                val context = androidx.compose.ui.platform.LocalContext.current
                                // Custom Card for Files/Folders
                                org.knp.vortex.ui.components.GlassyCard(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .aspectRatio(1f), // Square for folders/files
                                    onClick = { 
                                        if (entry.is_directory) {
                                            viewModel.browse(libraryId, entry.path)
                                        } else {
                                            if (entry.media_id != null) {
                                                onPlayMedia(entry.media_id, libraryType)
                                            } else {
                                                android.widget.Toast.makeText(context, "Processing media, please wait...", android.widget.Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    },
                                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                                ) {
                                    Box(modifier = Modifier.fillMaxSize()) {
                                        val context = androidx.compose.ui.platform.LocalContext.current
                                        val thumbnailRequest = androidx.compose.runtime.remember(entry.poster_url, entry.media_id, uiState.serverUrl) {
                                            if (entry.poster_url == null && entry.media_id == null) return@remember null
                                            
                                            // Use poster_url if available, otherwise use server thumbnail endpoint
                                            val imageUrl = org.knp.vortex.utils.formatImageUrl(entry.poster_url, uiState.serverUrl)
                                                ?: "${uiState.serverUrl.trimEnd('/')}/api/v1/media/${entry.media_id}/thumbnail"
                                            
                                            coil.request.ImageRequest.Builder(context)
                                                .data(imageUrl)
                                                .crossfade(true)
                                                .allowHardware(false)
                                                .size(512)
                                                .build()
                                        }
                                        
                                        var isError by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
                                        
                                        if (thumbnailRequest != null && !isError) {
                                            AsyncImage(
                                                model = thumbnailRequest,
                                                contentDescription = entry.name,
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Crop,
                                                onError = { isError = true }
                                            )
                                            // Overlay the name at the bottom
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .background(
                                                        Brush.verticalGradient(
                                                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f)),
                                                            startY = 100f
                                                        )
                                                    )
                                            )
                                            Text(
                                                text = entry.name,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Color.White,
                                                maxLines = 1,
                                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                                                modifier = Modifier.align(Alignment.BottomStart).padding(8.dp)
                                            )
                                        } else {
                                            Column(
                                                modifier = Modifier.fillMaxSize().padding(8.dp),
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.Center
                                            ) {
                                                Icon(
                                                    imageVector = if (entry.is_directory) androidx.compose.material.icons.Icons.Filled.Folder else androidx.compose.material.icons.Icons.Filled.PlayArrow,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(48.dp)
                                                )
                                                Spacer(modifier = Modifier.height(8.dp))
                                                Text(
                                                    text = entry.name,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = Color.White,
                                                    maxLines = 2,
                                                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            items(uiState.mediaItems) { item ->
                                ModernMediaCard(
                                    title = item.title,
                                    posterUrl = org.knp.vortex.utils.formatImageUrl(item.poster_url, uiState.serverUrl) ?: "${uiState.serverUrl.trimEnd('/')}/api/v1/media/${item.id}/thumbnail",
                                    year = item.year,
                                    onClick = { onPlayMedia(item.id, libraryType) },
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
}

@Composable
private fun MusicViewToggle(
    selected: MusicView,
    onSelect: (MusicView) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(24.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        MusicViewTab("Artists", selected == MusicView.ARTISTS) { onSelect(MusicView.ARTISTS) }
        MusicViewTab("Songs", selected == MusicView.SONGS) { onSelect(MusicView.SONGS) }
    }
}

@Composable
private fun MusicViewTab(label: String, active: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(20.dp))
            .background(if (active) PrimaryBlue else Color.Transparent)
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
    track: org.knp.vortex.data.remote.TrackDto,
    serverUrl: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val cover = org.knp.vortex.utils.formatImageUrl(track.cover_url, serverUrl)
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(androidx.compose.foundation.shape.RoundedCornerShape(6.dp))
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
                    androidx.compose.material.icons.Icons.Filled.MusicNote,
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
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
            val subtitle = listOfNotNull(track.artist, track.album).joinToString(" • ")
            if (subtitle.isNotBlank()) {
                Text(
                    text = subtitle,
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }
        }
        val dur = formatSongDuration(track.duration)
        if (dur.isNotBlank()) {
            Spacer(Modifier.width(8.dp))
            Text(dur, color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelSmall)
        }
    }
}

private fun formatSongDuration(seconds: Long?): String {
    if (seconds == null || seconds <= 0) return ""
    val m = seconds / 60
    val s = seconds % 60
    return "%d:%02d".format(m, s)
}
