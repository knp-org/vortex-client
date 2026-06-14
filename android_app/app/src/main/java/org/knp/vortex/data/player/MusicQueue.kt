package org.knp.vortex.data.player

import org.knp.vortex.data.remote.TrackDto
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-memory hand-off for the music player queue. Whichever screen starts
 * playback (album detail, the library "Songs" list, …) fills this in and then
 * navigates to the player, which consumes it. Mirrors the web client's
 * MusicPlayerContext, which holds the active queue independent of any one album.
 */
@Singleton
class MusicQueue @Inject constructor() {
    var tracks: List<TrackDto> = emptyList()
        private set
    var startIndex: Int = 0
        private set
    var title: String = "Now Playing"
        private set

    fun set(tracks: List<TrackDto>, startIndex: Int, title: String = "Now Playing") {
        this.tracks = tracks
        this.startIndex = startIndex.coerceIn(0, (tracks.size - 1).coerceAtLeast(0))
        this.title = title
    }
}
