package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyGridScope
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.knp.vortex.data.remote.SeriesDto
import org.knp.vortex.ui.components.AppHeader
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.ModernMediaCard

/** Series/Books grids can be sorted alphabetically. */
enum class SortOrder {
    NAME_ASC, NAME_DESC
}

/** Falls back to a Title-cased version of the library type when no name is set. */
fun libraryDisplayTitle(libraryName: String, libraryType: String): String =
    libraryName.ifBlank {
        libraryType.replace("_", " ").split(" ")
            .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
    }

fun sortSeries(series: List<SeriesDto>, order: SortOrder): List<SeriesDto> = when (order) {
    SortOrder.NAME_ASC -> series.sortedBy { it.name.lowercase() }
    SortOrder.NAME_DESC -> series.sortedByDescending { it.name.lowercase() }
}

/** Glassy background + header + padded Column, shared by every per-type library screen. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScaffold(
    title: String,
    onBack: () -> Unit,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable ColumnScope.() -> Unit
) {
    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = { AppHeader(title = title, onBack = onBack, actions = actions) }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding), content = content)
        }
    }
}

@Composable
fun LibraryLoading() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Color.White)
    }
}

@Composable
fun LibraryError(message: String?) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = message ?: "Error", color = Color.Red)
    }
}

@Composable
fun LibraryEmpty(message: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(message, color = Color.White.copy(alpha = 0.6f))
    }
}

/**
 * Standard adaptive poster grid used by movie/series/music-video screens. [minCellSize] widens the
 * columns for landscape (16:9) content like music videos so the cards aren't tiny.
 */
@Composable
fun PosterGrid(
    modifier: Modifier = Modifier,
    minCellSize: androidx.compose.ui.unit.Dp = 120.dp,
    fixedColumns: Int? = null,
    content: LazyGridScope.() -> Unit
) {
    LazyVerticalGrid(
        columns = if (fixedColumns != null) GridCells.Fixed(fixedColumns) else GridCells.Adaptive(minSize = minCellSize),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        modifier = modifier.fillMaxSize(),
        content = content
    )
}

/** Series/Book poster grid (tv_shows and books render identically; only navigation differs). */
@Composable
fun SeriesGrid(
    series: List<SeriesDto>,
    serverUrl: String,
    onOpen: (Long) -> Unit,
    modifier: Modifier = Modifier
) {
    PosterGrid(modifier = modifier) {
        items(series) { item ->
            ModernMediaCard(
                title = item.name,
                posterUrl = org.knp.vortex.utils.formatImageUrl(item.poster_url, serverUrl),
                year = null,
                onClick = { onOpen(item.id) },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
