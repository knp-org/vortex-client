package org.knp.vortex.ui.screens.library

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel

/**
 * Book (comic) libraries render the same sortable series-poster grid as TV shows; only the
 * navigation target differs (a tapped item opens the comic series viewer). Reuses
 * [SeriesLibraryContent] and [SeriesLibraryViewModel] — the grid logic is identical — while
 * remaining a distinct screen so the dispatcher and navigation stay readable.
 */
@Composable
fun BookLibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onOpenSeries: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: SeriesLibraryViewModel = hiltViewModel()
) {
    SeriesLibraryContent(libraryId, libraryName, libraryType, onOpenSeries, onBack, viewModel)
}
