package org.knp.vortex.ui.screens.library

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.FileSystemEntryDto
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.ui.components.GlassyCard
import org.knp.vortex.ui.components.SectionHeader
import javax.inject.Inject

data class FilesLibraryUiState(
    val isLoading: Boolean = true,
    val entries: List<FileSystemEntryDto> = emptyList(),
    val currentPath: String = "",
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class FilesLibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    private val settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {
    var uiState by mutableStateOf(FilesLibraryUiState(serverUrl = settingsRepository.getServerUrl()))
        private set

    private var loaded = false

    fun loadInitial(libId: Long) {
        if (loaded) return
        loaded = true
        browse(libId, "")
    }

    fun browse(libId: Long, path: String) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            repository.browseLibrary(libId, path)
                .onSuccess { uiState = uiState.copy(isLoading = false, entries = it, currentPath = path) }
                .onFailure { uiState = uiState.copy(isLoading = false, error = it.message) }
        }
    }

    fun goUp(libId: Long) {
        val current = uiState.currentPath
        if (current.isEmpty()) return
        val parts = current.split("/").filter { it.isNotEmpty() }
        val newPath = if (parts.size <= 1) "" else parts.dropLast(1).joinToString("/")
        browse(libId, newPath)
    }
}

@Composable
fun FilesLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onPlayMedia: (Long, String?) -> Unit,
    onBack: () -> Unit,
    viewModel: FilesLibraryViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    LaunchedEffect(libraryId) { viewModel.loadInitial(libraryId) }

    // System back navigates up the directory tree before leaving the screen.
    BackHandler(enabled = uiState.currentPath.isNotEmpty()) { viewModel.goUp(libraryId) }

    val effectiveOnBack = {
        if (uiState.currentPath.isNotEmpty()) viewModel.goUp(libraryId) else onBack()
    }

    LibraryScaffold(title = libraryDisplayTitle(libraryName, libraryType), onBack = effectiveOnBack) {
        if (uiState.currentPath.isNotEmpty()) {
            Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                SectionHeader(title = "... / ${uiState.currentPath.substringAfterLast('/')}")
            }
        }

        when {
            uiState.isLoading -> LibraryLoading()
            uiState.error != null -> LibraryError(uiState.error)
            else -> {
                PosterGrid {
                    items(uiState.entries) { entry ->
                        FileEntryCard(
                            entry = entry,
                            serverUrl = uiState.serverUrl,
                            onOpenDirectory = { viewModel.browse(libraryId, entry.path) },
                            onPlayMedia = { onPlayMedia(it, libraryType) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FileEntryCard(
    entry: FileSystemEntryDto,
    serverUrl: String,
    onOpenDirectory: () -> Unit,
    onPlayMedia: (Long) -> Unit
) {
    val context = LocalContext.current
    GlassyCard(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f),
        onClick = {
            if (entry.is_directory) {
                onOpenDirectory()
            } else if (entry.media_id != null) {
                onPlayMedia(entry.media_id)
            } else {
                android.widget.Toast.makeText(context, "Processing media, please wait...", android.widget.Toast.LENGTH_SHORT).show()
            }
        },
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            val thumbnailRequest = remember(entry.poster_url, entry.media_id, serverUrl) {
                if (entry.poster_url == null && entry.media_id == null) return@remember null
                val imageUrl = org.knp.vortex.utils.formatImageUrl(entry.poster_url, serverUrl)
                    ?: "${serverUrl.trimEnd('/')}/api/v1/media/${entry.media_id}/thumbnail"
                coil.request.ImageRequest.Builder(context)
                    .data(imageUrl)
                    .crossfade(true)
                    .allowHardware(false)
                    .size(512)
                    .build()
            }

            var isError by remember { mutableStateOf(false) }

            if (thumbnailRequest != null && !isError) {
                AsyncImage(
                    model = thumbnailRequest,
                    contentDescription = entry.name,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                    onError = { isError = true }
                )
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
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.align(Alignment.BottomStart).padding(8.dp)
                )
            } else {
                Column(
                    modifier = Modifier.fillMaxSize().padding(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = if (entry.is_directory) Icons.Filled.Folder else Icons.Filled.PlayArrow,
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
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
