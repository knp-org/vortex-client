package org.knp.vortex.data.remote

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Body
import retrofit2.http.Query

const val API_VERSION = "/api/v1"

interface MediaApi {
    // Redesigned per-type catalog API: listing endpoints return lightweight Cards.
    @GET("$API_VERSION/recent")
    suspend fun getRecentlyAdded(): List<CardDto>

    @GET("$API_VERSION/libraries")
    suspend fun getLibraries(): List<LibraryDto>

    @GET("$API_VERSION/libraries/{id}/media")
    suspend fun getLibraryMedia(@Path("id") id: Long): List<CardDto>

    @GET("$API_VERSION/libraries/{id}/browse")
    suspend fun browseLibrary(@Path("id") id: Long, @Query("path") path: String?): List<FileSystemEntryDto>

    @GET("$API_VERSION/continue")
    suspend fun getContinueWatching(): List<ContinueItemDto>

    @GET("$API_VERSION/media/{id}/progress")
    suspend fun getProgress(@Path("id") id: Long): ProgressDto

    // Per-kind detail; the server returns a `kind`-discriminated JSON object that we
    // parse into one superset DTO and map to the UI model in the repository.
    @GET("$API_VERSION/media/{id}")
    suspend fun getMediaDetails(@Path("id") id: Long): SrvMediaDetailDto

    @POST("$API_VERSION/media/{id}/refresh")
    suspend fun refreshMetadata(@Path("id") id: Long): SrvMediaDetailDto

    @POST("$API_VERSION/media/{id}/progress")
    suspend fun updateProgress(@Path("id") id: Long, @Body progress: ProgressDto)
    @POST("$API_VERSION/libraries")
    suspend fun createLibrary(@Body request: CreateLibraryRequest)

    @retrofit2.http.PUT("$API_VERSION/libraries/{id}")
    suspend fun updateLibrary(@Path("id") id: Long, @Body request: UpdateLibraryRequest)

    @POST("$API_VERSION/directories")
    suspend fun listDirectories(@Body request: ListDirectoriesRequest): List<DirectoryEntryDto>

    @POST("$API_VERSION/scan")
    suspend fun scanLibraries()

    @retrofit2.http.DELETE("$API_VERSION/libraries/{id}")
    suspend fun deleteLibrary(@Path("id") id: Long): retrofit2.Response<Unit>

    // TV Show / Comic series endpoints. The redesigned server keys series by numeric
    // id (a `series.id`), and `library_id` scopes the list to a single library so TV
    // shows and Books (comics) don't bleed into each other.
    @GET("$API_VERSION/series")
    suspend fun getSeries(@Query("library_id") libraryId: Long? = null): List<CardDto>

    @GET("$API_VERSION/series/{id}/seasons")
    suspend fun getSeriesSeasons(@Path("id") id: Long): List<SrvSeasonDto>

    @GET("$API_VERSION/series/{id}/detail")
    suspend fun getSeriesDetail(@Path("id") id: Long): SrvSeriesDetailDto

    @POST("$API_VERSION/series/{id}/refresh")
    suspend fun refreshSeriesMetadata(@Path("id") id: Long): SrvSeriesDetailDto

    @GET("$API_VERSION/series/{id}/season/{num}")
    suspend fun getSeasonEpisodes(@Path("id") id: Long, @Path("num") num: Int): List<SrvEpisodeDto>

    @POST("$API_VERSION/series/{id}/identify")
    suspend fun identifySeries(@Path("id") id: Long, @Body request: IdentifyRequest): SrvSeriesDetailDto

    // Settings endpoints
    @GET("$API_VERSION/settings")
    suspend fun getSettings(): List<SettingDto>

    @POST("$API_VERSION/settings")
    suspend fun updateSetting(@Body request: UpdateSettingRequest)

    @POST("$API_VERSION/system/clear")
    suspend fun resetDatabase()

    @GET("$API_VERSION/providers")
    suspend fun getProviders(): List<ProviderInfoDto>

    @POST("$API_VERSION/providers/{id}/toggle")
    suspend fun toggleProvider(@Path("id") id: String, @Body request: ToggleProviderRequest)

    @retrofit2.http.PUT("$API_VERSION/providers/order")
    suspend fun reorderProviders(@Body request: ReorderProvidersRequest)
    
    @GET("$API_VERSION/providers/{id}/config")
    suspend fun getProviderConfig(@Path("id") id: String): ProviderConfigResponse
    
    @retrofit2.http.PUT("$API_VERSION/providers/{id}/config")
    suspend fun updateProviderConfig(@Path("id") id: String, @Body request: UpdateConfigRequest)

    @GET("$API_VERSION/metadata/search")
    suspend fun searchMetadata(@Query("query") query: String, @Query("media_type") mediaType: String?): List<MetadataSearchResultDto>

    @GET("$API_VERSION/library/search")
    suspend fun searchLibrary(@Query("query") query: String, @Query("media_type") mediaType: String?): List<CardDto>

    @POST("$API_VERSION/media/{id}/identify")
    suspend fun identifyMedia(@Path("id") id: Long, @Body request: IdentifyRequest): SrvMediaDetailDto

    @GET("$API_VERSION/stream/{id}/subtitles")
    suspend fun getSubtitles(@Path("id") id: Long): List<SubtitleTrackDto>

    @GET("$API_VERSION/books/{id}/info")
    suspend fun getBookInfo(@Path("id") id: Long): BookInfoDto

    // Music browse (new per-type catalog API).
    @GET("$API_VERSION/artists")
    suspend fun getArtists(@Query("library_id") libraryId: Long?): List<CardDto>

    @GET("$API_VERSION/artists/{id}")
    suspend fun getArtistDetail(@Path("id") id: Long): ArtistDetailDto

    @GET("$API_VERSION/albums/{id}")
    suspend fun getAlbumDetail(@Path("id") id: Long): AlbumDetailDto

    // Flat list of every track in a music library (server orders by artist/album;
    // the client re-sorts by title for the "Songs" view).
    @GET("$API_VERSION/libraries/{id}/tracks")
    suspend fun getLibraryTracks(@Path("id") id: Long): List<TrackDto>

    // Typed reader of /libraries/:id/media (returns Cards). Used for the
    // music_video poster grid; movies keep using getLibraryMedia (MediaItemDto).
    @GET("$API_VERSION/libraries/{id}/media")
    suspend fun getLibraryCards(@Path("id") id: Long): List<CardDto>

    @GET("$API_VERSION/media/{id}/lyrics")
    suspend fun getTrackLyrics(@Path("id") id: Long): LyricsDto
}

// A lightweight card for grid/listing views. `kind` (artist | album | music_video |
// movie | episode | book | series) tells the client which detail/stream route to use.
data class CardDto(
    val id: Long,
    val kind: String,
    val title: String?,
    val poster_url: String?,
    val year: Long?,
    val stream_url: String?
)

// A person credited on an item or series (server `CreditDto`).
data class CreditDto(
    val name: String,
    val character: String?,
    val role: String?,
    val profile_url: String?,
    val ord: Long?
)

// /continue item (server `ContinueItem`).
data class ContinueItemDto(
    val id: Long,
    val kind: String,
    val title: String?,
    val poster_url: String?,
    val position: Long,
    val total_duration: Long,
    val reading_style: String?,
    val stream_url: String
)

// Superset of every `kind`-specific detail shape returned by GET /media/{id}. Fields
// are populated according to `kind`; the repository maps this into MediaItemDto.
data class SrvMediaDetailDto(
    val id: Long,
    val kind: String?,
    val title: String?,
    val name: String?,
    val year: Long?,
    val plot: String?,
    val tagline: String?,
    val runtime: Long?,
    val rating: Double?,
    val age_rating: String?,
    val studio: String?,
    val collection_name: String?,
    val origin_country: String?,
    val creator: String?,
    val poster_url: String?,
    val backdrop_url: String?,
    val trailer_url: String?,
    val genres: List<String>?,
    val tags: List<String>?,
    val cast: List<CreditDto>?,
    val stream_url: String?,
    // episode
    val series_id: Long?,
    val series_name: String?,
    val season_number: Long?,
    val episode_number: Long?,
    val still_url: String?,
    val air_date: String?,
    // book
    val page_count: Long?,
    val reading_mode: String?,
    val publisher: String?,
    val published_date: String?,
    val isbn: String?,
    // music_video / album (track detail resolves to its album)
    val artist: String?,
    val artist_id: Long?,
    val cover_url: String?,
    val tracks: List<TrackDto>?
)

// Server `SeriesDetail` (id-keyed; genres/tags/cast are arrays).
data class SrvSeriesDetailDto(
    val id: Long,
    val name: String,
    val year: Long?,
    val plot: String?,
    val poster_url: String?,
    val backdrop_url: String?,
    val rating: Double?,
    val age_rating: String?,
    val studio: String?,
    val trailer_url: String?,
    val collection_name: String?,
    val origin_country: String?,
    val creator: String?,
    val genres: List<String>?,
    val tags: List<String>?,
    val cast: List<CreditDto>?,
    val seasons: List<SrvSeasonDto>
)

// Server `SeasonDto`.
data class SrvSeasonDto(
    val id: Long,
    val season_number: Long,
    val episode_count: Long,
    val poster_url: String?
)

// Server `EpisodeDto` (no file_path; carries a stream_url instead).
data class SrvEpisodeDto(
    val id: Long,
    val series_id: Long?,
    val series_name: String?,
    val season_number: Long?,
    val episode_number: Long?,
    val title: String?,
    val plot: String?,
    val still_url: String?,
    val runtime: Long?,
    val air_date: String?,
    val stream_url: String
)

data class ArtistDetailDto(
    val id: Long,
    val name: String,
    val bio: String?,
    val image_url: String?,
    val albums: List<CardDto>
)

data class AlbumDetailDto(
    val id: Long,
    val title: String,
    val artist_id: Long?,
    val artist: String?,
    val year: Long?,
    val cover_url: String?,
    val tracks: List<TrackDto>
)

data class TrackDto(
    val id: Long, // media_items.id
    val track_number: Long?,
    val disc_number: Long?,
    val title: String?,
    val artist: String?,
    val album: String?,
    val cover_url: String?,
    val duration: Long?, // seconds
    val stream_url: String
)

data class LyricsDto(
    val synced: Boolean,
    val source: String,
    val lines: List<LyricLineDto>
)

data class LyricLineDto(
    val time: Double?, // seconds; null for unsynced lines
    val text: String
)

data class BookInfoDto(
    val id: Long,
    val title: String?,
    val format: String,
    val page_count: Long?,
    val reading_mode: String
)

data class SubtitleTrackDto(
    val id: String,
    val label: String,
    val language: String,
    val source: String,
    val url: String
)

data class MetadataSearchResultDto(
    val title: String,
    val year: String?, // NormalizedMetadata uses Option<String>
    val poster_url: String?,
    val plot: String?, // Renamed from overview
    val provider_ids: Map<String, Any>?,
    val media_type: String?
)

data class IdentifyRequest(
    val provider_id: String,
    val media_type: String?,
    val provider_name: String? = null
)

data class ListDirectoriesRequest(
    val path: String? = null
)

data class DirectoryEntryDto(
    val name: String,
    val path: String
)

data class FileSystemEntryDto(
    val name: String,
    val path: String,
    val is_directory: Boolean,
    val media_id: Long?,
    val poster_url: String?
)

data class CreateLibraryRequest(
    val name: String,
    val paths: List<String>,
    val library_type: String
)

data class UpdateLibraryRequest(
    val name: String,
    val paths: List<String>,
    val library_type: String
)

data class UpdateSettingRequest(
    val key: String,
    val value: String
)

data class SettingDto(
    val key: String,
    val value: String
)

data class MediaItemDto(
    val id: Long,
    val file_path: String,
    val title: String?,
    val year: Long?,
    val poster_url: String?,
    val plot: String?,
    val media_type: String?,
    val series_name: String?,
    val series_id: Long?,
    val progress: Long?, // Optional for continue watching
    val runtime: Int?,
    val genres: String?,
    val backdrop_url: String?,
    val library_type: String?,
    val season_number: Int?,
    val episode_number: Int?,
    val still_url: String?,
    val rating: Float?,
    val cast: String?,
    val director: String?,
    val age_rating: String?,
    val studio: String?,
    val trailer_url: String?,
    val origin_country: String?,
    val collection_name: String?,
    val creator: String?,
    val tags: String?,
    val page_count: Int?
)

data class LibraryDto(
    val id: Long,
    val name: String,
    val paths: List<String>,
    val library_type: String,
    val default_reading_mode: String? = null
)

data class ProgressDto(
    val position: Long,
    val total_duration: Long? = 0,
    val reading_style: String? = null
)

// TV Show / Comic UI models (mapped from server Cards/SeriesDetail in the repository).
data class SeriesDto(
    val id: Long,
    val name: String,
    val poster_url: String?,
    val season_count: Int
)

data class SeasonDto(
    val season_number: Int,
    val episode_count: Int,
    val poster_url: String?
)

data class EpisodeDto(
    val id: Long,
    val title: String?,
    val episode_number: Int,
    val poster_url: String?,
    val file_path: String,
    val plot: String?,
    val runtime: Int?,
    val rating: Float?,
    val cast: String?,
    val director: String?,
    val age_rating: String?,
    val studio: String?,
    val trailer_url: String?,
    val origin_country: String?,
    val collection_name: String?,
    val creator: String?,
    val tags: String?
)

data class SeriesDetailDto(
    val id: Long,
    val name: String,
    val poster_url: String?,
    val backdrop_url: String?,
    val plot: String?,
    val year: Long?,
    val genres: String?,
    val cast: String?,
    val director: String?,
    val age_rating: String?,
    val studio: String?,
    val trailer_url: String?,
    val origin_country: String?,
    val collection_name: String?,
    val creator: String?,
    val tags: String?,
    val seasons: List<SeasonDto>
)

data class ConfigFieldDto(
    val key: String,
    val label: String,
    val field_type: String,
    val required: Boolean,
    val options: List<List<String>>? = null
)

data class ProviderInfoDto(
    val id: String,
    val name: String,
    val description: String,
    val media_types: List<String>,
    val config_schema: List<ConfigFieldDto>,
    val enabled: Boolean,
    val priority: Int,
    val configured: Boolean
)

data class ProviderConfigResponse(
    val provider_id: String,
    val enabled: Boolean,
    val priority: Int,
    val config: Map<String, Any>
)

data class UpdateConfigRequest(
    val config: Map<String, Any>
)

data class ToggleProviderRequest(
    val enabled: Boolean
)

data class ReorderProvidersRequest(
    val order: List<String>
)
