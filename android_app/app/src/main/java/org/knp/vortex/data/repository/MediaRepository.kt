package org.knp.vortex.data.repository

import org.knp.vortex.data.remote.MediaApi
import org.knp.vortex.data.remote.MediaItemDto
import org.knp.vortex.data.remote.ProgressDto
import org.knp.vortex.data.remote.CreateLibraryRequest
import org.knp.vortex.data.remote.UpdateLibraryRequest
import org.knp.vortex.data.remote.ListDirectoriesRequest
import org.knp.vortex.data.remote.CardDto
import org.knp.vortex.data.remote.ContinueItemDto
import org.knp.vortex.data.remote.CreditDto
import org.knp.vortex.data.remote.EpisodeDto
import org.knp.vortex.data.remote.SeasonDto
import org.knp.vortex.data.remote.SeriesDto
import org.knp.vortex.data.remote.SeriesDetailDto
import org.knp.vortex.data.remote.SrvEpisodeDto
import org.knp.vortex.data.remote.SrvMediaDetailDto
import org.knp.vortex.data.remote.SrvSeasonDto
import org.knp.vortex.data.remote.SrvSeriesDetailDto
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Anti-corruption layer over the redesigned, id-based catalog API.
 *
 * The server returns lightweight `Card`s for listings and `kind`-discriminated detail
 * objects with array `cast`/`genres`/`tags`. To keep the existing screens working, the
 * repository maps those server shapes back into the long-standing UI models
 * (MediaItemDto / SeriesDto / SeriesDetailDto / EpisodeDto).
 */
@Singleton
class MediaRepository @Inject constructor(
    private val api: MediaApi
) {
    // ---- server -> UI model mappers -------------------------------------------------

    private fun joinOrNull(items: List<String>?): String? =
        items?.takeIf { it.isNotEmpty() }?.joinToString(", ")

    /** Encode credits as the JSON array string that CastList already knows how to parse. */
    private fun creditsToJson(cast: List<CreditDto>?): String? {
        if (cast.isNullOrEmpty()) return null
        val arr = org.json.JSONArray()
        cast.forEach { c ->
            val o = org.json.JSONObject()
            o.put("name", c.name)
            o.put("character", c.character ?: c.role ?: "")
            if (c.profile_url != null) o.put("profile_url", c.profile_url)
            arr.put(o)
        }
        return arr.toString()
    }

    private fun CardDto.toMediaItem(): MediaItemDto = MediaItemDto(
        id = id, file_path = "", title = title, year = year, poster_url = poster_url,
        plot = null, media_type = kind, series_name = null, series_id = null, progress = null, runtime = null,
        genres = null, backdrop_url = null, library_type = null, season_number = null,
        episode_number = null, still_url = null, rating = null, cast = null, director = null,
        age_rating = null, studio = null, trailer_url = null, origin_country = null,
        collection_name = null, creator = null, tags = null, page_count = null
    )

    private fun ContinueItemDto.toMediaItem(): MediaItemDto = MediaItemDto(
        id = id, file_path = "", title = title, year = null, poster_url = poster_url,
        plot = null, media_type = kind, series_name = null, series_id = null, progress = position,
        runtime = total_duration.toInt(), genres = null, backdrop_url = null,
        library_type = null, season_number = null, episode_number = null, still_url = null,
        rating = null, cast = null, director = null, age_rating = null, studio = null,
        trailer_url = null, origin_country = null, collection_name = null, creator = null,
        tags = null, page_count = null
    )

    private fun SrvMediaDetailDto.toMediaItem(): MediaItemDto = MediaItemDto(
        id = id, file_path = "", title = title ?: name, year = year,
        poster_url = poster_url ?: cover_url, plot = plot, media_type = kind,
        series_name = series_name, series_id = series_id, progress = null, runtime = runtime?.toInt(),
        genres = joinOrNull(genres), backdrop_url = backdrop_url, library_type = null,
        season_number = season_number?.toInt(), episode_number = episode_number?.toInt(),
        still_url = still_url, rating = rating?.toFloat(), cast = creditsToJson(cast),
        director = null, age_rating = age_rating, studio = studio, trailer_url = trailer_url,
        origin_country = origin_country, collection_name = collection_name, creator = creator,
        tags = joinOrNull(tags), page_count = page_count?.toInt()
    )

    private fun CardDto.toSeries(): SeriesDto =
        SeriesDto(id = id, name = title ?: "", poster_url = poster_url, season_count = 0)

    private fun SrvSeasonDto.toUi(): SeasonDto =
        SeasonDto(season_number = season_number.toInt(), episode_count = episode_count.toInt(), poster_url = poster_url)

    private fun SrvSeriesDetailDto.toUi(): SeriesDetailDto = SeriesDetailDto(
        id = id, name = name, poster_url = poster_url, backdrop_url = backdrop_url, plot = plot,
        year = year, genres = joinOrNull(genres), cast = creditsToJson(cast), director = null,
        age_rating = age_rating, studio = studio, trailer_url = trailer_url,
        origin_country = origin_country, collection_name = collection_name, creator = creator,
        tags = joinOrNull(tags), seasons = seasons.map { it.toUi() }
    )

    private fun SrvEpisodeDto.toUi(): EpisodeDto = EpisodeDto(
        id = id, title = title, episode_number = (episode_number ?: 0).toInt(),
        poster_url = still_url, file_path = "", plot = plot, runtime = runtime?.toInt(),
        rating = null, cast = null, director = null, age_rating = null, studio = null,
        trailer_url = null, origin_country = null, collection_name = null, creator = null, tags = null
    )

    // ---- catalog --------------------------------------------------------------------

    suspend fun getRecentlyAdded(): Result<List<MediaItemDto>> = runCatching {
        api.getRecentlyAdded().map { it.toMediaItem() }
    }

    suspend fun getLibraries() = runCatching { api.getLibraries() }

    suspend fun createLibrary(name: String, paths: List<String>, type: String) = runCatching {
        api.createLibrary(CreateLibraryRequest(name, paths, type))
    }

    suspend fun updateLibrary(id: Long, name: String, paths: List<String>, type: String) = runCatching {
        api.updateLibrary(id, UpdateLibraryRequest(name, paths, type))
    }

    suspend fun listDirectories(path: String?) = runCatching { 
        api.listDirectories(ListDirectoriesRequest(path)) 
    }

    suspend fun scanLibraries() = runCatching { api.scanLibraries() }

    suspend fun deleteLibrary(id: Long) = runCatching { 
        val response = api.deleteLibrary(id)
        if (!response.isSuccessful) throw Exception("Delete failed: ${response.code()}")
    }

    suspend fun getLibraryMedia(id: Long) = runCatching { api.getLibraryMedia(id).map { it.toMediaItem() } }

    suspend fun browseLibrary(id: Long, path: String?) = runCatching { api.browseLibrary(id, path) }

    // Music browse
    suspend fun getArtists(libraryId: Long? = null) = runCatching { api.getArtists(libraryId) }

    suspend fun getArtistDetail(id: Long) = runCatching { api.getArtistDetail(id) }

    suspend fun getAlbumDetail(id: Long) = runCatching { api.getAlbumDetail(id) }

    suspend fun getLibraryTracks(id: Long) = runCatching { api.getLibraryTracks(id) }

    suspend fun getLibraryCards(id: Long) = runCatching { api.getLibraryCards(id) }

    suspend fun getTrackLyrics(id: Long, force: Boolean = false) = runCatching { api.getTrackLyrics(id, force) }

    // Per-user playlists. DTOs are already in UI shape, so no mappers needed.
    suspend fun getPlaylists() = runCatching { api.getPlaylists() }

    suspend fun createPlaylist(name: String) = runCatching {
        api.createPlaylist(org.knp.vortex.data.remote.CreatePlaylistRequest(name))
    }

    suspend fun getPlaylistDetail(id: Long) = runCatching { api.getPlaylistDetail(id) }

    suspend fun deletePlaylist(id: Long) = runCatching {
        val response = api.deletePlaylist(id)
        if (!response.isSuccessful) throw Exception("Delete failed: ${response.code()}")
    }

    suspend fun addTrackToPlaylist(playlistId: Long, itemId: Long) = runCatching {
        api.addPlaylistTrack(playlistId, org.knp.vortex.data.remote.AddTrackRequest(itemId))
    }

    suspend fun removeTrackFromPlaylist(playlistId: Long, itemId: Long) = runCatching {
        val response = api.removePlaylistTrack(playlistId, itemId)
        if (!response.isSuccessful) throw Exception("Remove failed: ${response.code()}")
    }

    suspend fun getContinueWatching() = runCatching { api.getContinueWatching().map { it.toMediaItem() } }

    suspend fun getProgress(id: Long) = runCatching { api.getProgress(id) }

    suspend fun updateProgress(id: Long, position: Long, total: Long, readingStyle: String? = null) = runCatching {
        api.updateProgress(id, ProgressDto(position, total, readingStyle))
    }

    suspend fun getMediaDetails(id: Long) = runCatching { api.getMediaDetails(id).toMediaItem() }
    suspend fun getBookInfo(id: Long) = runCatching { api.getBookInfo(id) }

    suspend fun refreshMetadata(id: Long) = runCatching { api.refreshMetadata(id).toMediaItem() }

    suspend fun searchMetadata(query: String, mediaType: String?) = runCatching { api.searchMetadata(query, mediaType) }

    suspend fun searchLibrary(query: String, mediaType: String?) = runCatching { api.searchLibrary(query, mediaType).map { it.toMediaItem() } }

    suspend fun identifyMedia(id: Long, providerId: String, mediaType: String?, providerName: String? = null) = runCatching {
        api.identifyMedia(id, org.knp.vortex.data.remote.IdentifyRequest(providerId, mediaType, providerName)).toMediaItem()
    }

    // TV Show / Comic series methods, keyed by numeric series id. Pass a libraryId to
    // scope the series list to one library.
    suspend fun getSeries(libraryId: Long? = null) = runCatching { api.getSeries(libraryId).map { it.toSeries() } }

    suspend fun getSeriesSeasons(id: Long) = runCatching { api.getSeriesSeasons(id).map { it.toUi() } }

    suspend fun getSeasonEpisodes(id: Long, num: Int) = runCatching {
        api.getSeasonEpisodes(id, num).map { it.toUi() }
    }

    suspend fun getSeriesDetail(id: Long) = runCatching { api.getSeriesDetail(id).toUi() }

    suspend fun refreshSeriesMetadata(id: Long) = runCatching { api.refreshSeriesMetadata(id).toUi() }

    suspend fun identifySeries(id: Long, providerId: String, mediaType: String?, providerName: String? = null) = runCatching {
        api.identifySeries(id, org.knp.vortex.data.remote.IdentifyRequest(providerId, mediaType, providerName)).toUi()
    }

    suspend fun getSettings() = runCatching { api.getSettings() }

    suspend fun updateRemoteSetting(key: String, value: String) = runCatching { 
        api.updateSetting(org.knp.vortex.data.remote.UpdateSettingRequest(key, value)) 
    }

    suspend fun resetDatabase() = runCatching { api.resetDatabase() }

    suspend fun getSubtitles(id: Long) = runCatching { api.getSubtitles(id) }

    suspend fun getProviders() = runCatching {
        api.getProviders()
    }

    suspend fun toggleProvider(id: String, enabled: Boolean) = runCatching {
        api.toggleProvider(id, org.knp.vortex.data.remote.ToggleProviderRequest(enabled))
    }

    suspend fun reorderProviders(order: List<String>) = runCatching {
        api.reorderProviders(org.knp.vortex.data.remote.ReorderProvidersRequest(order))
    }

    suspend fun getProviderConfig(id: String) = runCatching {
        api.getProviderConfig(id)
    }

    suspend fun updateProviderConfig(id: String, config: Map<String, Any>) = runCatching {
        api.updateProviderConfig(id, org.knp.vortex.data.remote.UpdateConfigRequest(config))
    }
}
