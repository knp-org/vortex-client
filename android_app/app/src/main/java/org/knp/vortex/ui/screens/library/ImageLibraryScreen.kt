package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.CardDto
import org.knp.vortex.data.repository.MediaRepository
import javax.inject.Inject

data class ImageLibraryUiState(
    val isLoading: Boolean = true,
    val galleries: List<CardDto> = emptyList(),
    val error: String? = null,
    val serverUrl: String = ""
)

@HiltViewModel
class ImageLibraryViewModel @Inject constructor(
    private val repository: MediaRepository,
    settingsRepository: org.knp.vortex.data.repository.SettingsRepository
) : ViewModel() {
    var uiState by mutableStateOf(ImageLibraryUiState(serverUrl = settingsRepository.getServerUrl()))
        private set

    fun load(libId: Long) {
        if (uiState.galleries.isNotEmpty()) return
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, error = null)
            repository.getGalleries(libId)
                .onSuccess { uiState = uiState.copy(isLoading = false, galleries = it) }
                .onFailure { uiState = uiState.copy(isLoading = false, error = it.message) }
        }
    }
}

/**
 * Images libraries render a grid of photo albums (galleries). Each card shows the album
 * cover, or a 2x2 mosaic built from the gallery's first photos when no cover is set.
 * Tapping an album opens the gallery detail (photo grid + viewer).
 */
@Composable
fun ImageLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onOpenGallery: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: ImageLibraryViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    LaunchedEffect(libraryId) { viewModel.load(libraryId) }

    LibraryScaffold(title = libraryDisplayTitle(libraryName, libraryType), onBack = onBack) {
        when {
            uiState.isLoading -> LibraryLoading()
            uiState.error != null -> LibraryError(uiState.error)
            uiState.galleries.isEmpty() -> LibraryEmpty("No albums yet. Scan this library to import photos.")
            else -> {
                PosterGrid(minCellSize = 150.dp) {
                    items(uiState.galleries) { gallery ->
                        GalleryCard(
                            gallery = gallery,
                            serverUrl = uiState.serverUrl,
                            onClick = { onOpenGallery(gallery.id) }
                        )
                    }
                }
            }
        }
    }
}

/** Resolves a server-relative path ("/api/v1/...") against the configured server URL. */
internal fun serverPathUrl(path: String?, serverUrl: String): String? =
    path?.takeIf { it.isNotBlank() }?.let {
        if (it.startsWith("http://") || it.startsWith("https://")) it
        else serverUrl.trimEnd('/') + if (it.startsWith("/")) it else "/$it"
    }

@Composable
private fun GalleryCard(gallery: CardDto, serverUrl: String, onClick: () -> Unit) {
    val cover = org.knp.vortex.utils.formatImageUrl(gallery.poster_url, serverUrl)
    val thumbs = gallery.thumbs.orEmpty().mapNotNull { serverPathUrl(it, serverUrl) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.06f))
                .clickable(onClick = onClick)
        ) {
            when {
                cover != null -> AsyncImage(
                    model = cover,
                    contentDescription = gallery.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                thumbs.isNotEmpty() -> MosaicCover(thumbs)
            }
        }
        Text(
            text = gallery.title ?: "Album",
            color = Color.White,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

/** 2x2 collage of the album's first photos, used when the album has no explicit cover. */
@Composable
private fun MosaicCover(thumbs: List<String>) {
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        for (row in 0 until 2) {
            Row(
                Modifier.fillMaxWidth().weight(1f),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                for (col in 0 until 2) {
                    val url = thumbs.getOrNull(row * 2 + col) ?: thumbs.first()
                    AsyncImage(
                        model = url,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.weight(1f).fillMaxSize()
                    )
                }
            }
        }
    }
}
