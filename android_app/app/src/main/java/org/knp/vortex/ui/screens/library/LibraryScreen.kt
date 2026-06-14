package org.knp.vortex.ui.screens.library

import androidx.compose.runtime.Composable
import org.knp.vortex.data.remote.CardDto

/**
 * Dispatches a library to the right per-type screen based on [libraryType]. Each type owns its
 * own screen + ViewModel (see Movie/Series/Book/Music/MusicVideo/Files LibraryScreen) so this
 * file stays a thin router. The callback set is the superset every type might need; unused
 * callbacks are simply not forwarded.
 */
@Composable
fun LibraryScreen(
    libraryId: Long,
    libraryName: String,
    libraryType: String,
    onPlayMedia: (Long, String?) -> Unit,
    onOpenSeries: (Long, String) -> Unit,
    onOpenCard: (CardDto) -> Unit,
    onPlaySong: () -> Unit,
    onOpenPlaylist: (Long) -> Unit,
    onBack: () -> Unit
) {
    when (libraryType.lowercase()) {
        "tv_shows" -> SeriesLibraryScreen(
            libraryId = libraryId,
            libraryName = libraryName,
            libraryType = libraryType,
            onOpenSeries = { id -> onOpenSeries(id, libraryType) },
            onBack = onBack
        )
        "books" -> BookLibraryScreen(
            libraryId = libraryId,
            libraryName = libraryName,
            libraryType = libraryType,
            onOpenSeries = { id -> onOpenSeries(id, libraryType) },
            onBack = onBack
        )
        "music" -> MusicLibraryScreen(
            libraryId = libraryId,
            libraryName = libraryName,
            libraryType = libraryType,
            onOpenCard = onOpenCard,
            onPlaySong = onPlaySong,
            onOpenPlaylist = onOpenPlaylist,
            onBack = onBack
        )
        "music_videos" -> MusicVideoLibraryScreen(
            libraryId = libraryId,
            libraryName = libraryName,
            libraryType = libraryType,
            onOpenCard = onOpenCard,
            onBack = onBack
        )
        "other" -> FilesLibraryScreen(
            libraryId = libraryId,
            libraryName = libraryName,
            libraryType = libraryType,
            onPlayMedia = onPlayMedia,
            onBack = onBack
        )
        else -> MovieLibraryScreen(
            libraryId = libraryId,
            libraryName = libraryName,
            libraryType = libraryType,
            onPlayMedia = onPlayMedia,
            onBack = onBack
        )
    }
}
