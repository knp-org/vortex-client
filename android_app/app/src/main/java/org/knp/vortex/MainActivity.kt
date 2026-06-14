package org.knp.vortex

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import org.knp.vortex.ui.theme.MediaServerTheme
import org.knp.vortex.ui.screens.home.HomeScreen
import org.knp.vortex.ui.screens.library.ManageLibrariesScreen
import org.knp.vortex.ui.screens.library.CreateLibraryScreen
import org.knp.vortex.ui.screens.library.LibraryScreen
import org.knp.vortex.ui.screens.settings.SettingsScreen
import org.knp.vortex.ui.screens.settings.PlayerSettingsScreen
import org.knp.vortex.ui.screens.settings.ServerConfigScreen
import org.knp.vortex.ui.screens.settings.LibrarySettingsScreen
import org.knp.vortex.ui.screens.settings.MetadataProvidersScreen
import org.knp.vortex.ui.screens.settings.SecuritySettingsScreen
import org.knp.vortex.ui.screens.settings.AccountSettingsScreen
import org.knp.vortex.ui.screens.reader.ReaderScreen
import org.knp.vortex.ui.screens.player.PlayerScreen
import org.knp.vortex.ui.screens.movie.MovieDetailScreen
import org.knp.vortex.ui.screens.music.ArtistDetailScreen
import org.knp.vortex.ui.screens.music.AlbumDetailScreen
import org.knp.vortex.ui.screens.music.MusicPlayerScreen
import org.knp.vortex.ui.screens.identify.IdentifyScreen
import org.knp.vortex.ui.screens.series.SeriesDetailScreen
import dagger.hilt.android.AndroidEntryPoint
import java.net.URLEncoder
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

import androidx.fragment.app.FragmentActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import javax.inject.Inject
import org.knp.vortex.data.repository.SettingsRepository
import java.util.concurrent.Executor
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Person
import androidx.navigation.compose.currentBackStackEntryAsState


@AndroidEntryPoint
class MainActivity : FragmentActivity() {

    // @Inject lateinit var settingsRepository: SettingsRepository // Removed in favor of ViewModel
    
    private val viewModel: MainViewModel by viewModels()

    private val requestNotificationPermission =
        registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Needed (Android 13+) so the media-playback foreground service can post
        // its now-playing notification with transport controls.
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
            != android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            requestNotificationPermission.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        // Initial Check if enabled
        if (viewModel.isBiometricEnabled() && !viewModel.isBiometricUnlocked.value) {
             authenticate()
        } else {
             viewModel.setBiometricUnlocked(true)
        }

        setContent {
            MediaServerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val isBiometricUnlocked by viewModel.isBiometricUnlocked.collectAsState()
                    val authToken by viewModel.authToken.collectAsState()
                    
                    if (!isBiometricUnlocked && viewModel.isBiometricEnabled()) {
                         // Show Auth Screen or Placeholder while prompt is active
                         Box(Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                              Text("Unlock with Biometrics to continue", color = androidx.compose.ui.graphics.Color.White)
                              Button(onClick = { authenticate() }, modifier = Modifier.padding(top = 16.dp)) {
                                  Text("Touch to Unlock")
                              }
                         }
                    } else if (authToken == null) {
                        org.knp.vortex.ui.screens.login.LoginScreen(
                            onLoginSuccess = {
                                // Handled by collectAsState re-render
                            }
                        )
                    } else {
                        AppNavigation()
                    }
                }
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        if (viewModel.isBiometricEnabled() && !viewModel.isBiometricUnlocked.value) {
            authenticate()
        }
    }

    private fun authenticate() {
        val executor: Executor = ContextCompat.getMainExecutor(this)
        val biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                     super.onAuthenticationSucceeded(result)
                     viewModel.setBiometricUnlocked(true)
                }
                
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    // Handle cancel/error
                }
            })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Vortex Security")
            .setSubtitle("Unlock to access your media")
            .setNegativeButtonText("Cancel")
            .build()
            
        biometricPrompt.authenticate(promptInfo)
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    // Define items for Bottom Nav
    
    // We need current back stack entry to determine selected item
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    androidx.compose.material3.Scaffold(
        containerColor = org.knp.vortex.ui.theme.DeepBackground,
        bottomBar = {
             // Only show bottom nav on main screens
             if (currentDestination?.route in listOf("home", "search", "settings")) {
                 org.knp.vortex.ui.components.GlassyBottomNavigation {
                     org.knp.vortex.ui.components.GlassyBottomNavItem(
                         selected = currentDestination?.route == "home",
                         onClick = { navController.navigate("home") { 
                            popUpTo(navController.graph.startDestinationId) { saveState = true }
                            launchSingleTop = true 
                            restoreState = true
                         } },
                         icon = androidx.compose.material.icons.Icons.Default.Home,
                         label = "Home"
                     )
                     org.knp.vortex.ui.components.GlassyBottomNavItem(
                         selected = currentDestination?.route == "search",
                         onClick = { navController.navigate("search") { 
                            popUpTo(navController.graph.startDestinationId) { saveState = true }
                            launchSingleTop = true 
                            restoreState = true
                         } },
                         icon = androidx.compose.material.icons.Icons.Default.Search,
                         label = "Search"
                     )
                      org.knp.vortex.ui.components.GlassyBottomNavItem(
                         selected = currentDestination?.route == "settings",
                         onClick = { navController.navigate("settings") { 
                            popUpTo(navController.graph.startDestinationId) { saveState = true }
                            launchSingleTop = true 
                            restoreState = true
                         } },
                         icon = androidx.compose.material.icons.Icons.Default.Person,
                         label = "Profile"
                     )
                 }
             }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController, 
            startDestination = "home",
            modifier = Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding()),
            enterTransition = { androidx.compose.animation.fadeIn() },
            exitTransition = { androidx.compose.animation.fadeOut() },
            popEnterTransition = { androidx.compose.animation.fadeIn() },
            popExitTransition = { androidx.compose.animation.fadeOut() }
        ) {
        composable("home") {
            HomeScreen(
                onPlayMedia = { id, type -> 
                    val t = type?.lowercase() ?: ""
                    if (t == "other" || t == "music_videos") {
                        navController.navigate("player/$id")
                    } else if (t == "books") {
                        navController.navigate("book/$id")
                    } else {
                        navController.navigate("movie/$id")
                    }
                },
                onOpenSeries = { seriesId, type ->
                    if (type.lowercase() == "books") {
                        navController.navigate("comicseries/$seriesId")
                    } else {
                        navController.navigate("series/$seriesId/detail")
                    }
                },
                onOpenLibrary = { id, name, type ->
                    val encodedName = URLEncoder.encode(name, StandardCharsets.UTF_8.toString())
                    navController.navigate("library/$id/$encodedName/$type")
                },
                onOpenCard = { id, kind ->
                    when (kind) {
                        "artist" -> navController.navigate("artist/$id")
                        "album" -> navController.navigate("album/$id")
                        "music_video" -> navController.navigate("player/$id")
                        else -> navController.navigate("movie/$id")
                    }
                },

                onQuickPlay = { id ->
                    // Direct Playback
                    navController.navigate("player/$id") 
                }
            )
        }
        
        composable("search") {
            org.knp.vortex.ui.screens.search.SearchScreen(
                onPlayMedia = { id, type -> 
                    val t = type?.lowercase() ?: ""
                    if (t == "other" || t == "music_videos") {
                        navController.navigate("player/$id")
                    } else if (t == "books") {
                        navController.navigate("book/$id")
                    } else {
                        navController.navigate("movie/$id")
                    }
                },
                onOpenSeries = { seriesId ->
                    navController.navigate("series/$seriesId/detail")
                }
            )
        }
        composable("settings") {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onNavigateToServerConfig = { navController.navigate("settings/server") },
                onNavigateToLibrarySettings = { navController.navigate("manage_libraries") },
                onNavigateToMetadataProviders = { navController.navigate("settings/metadata") },
                onNavigateToSecurity = { navController.navigate("settings/security") },
                onNavigateToPlayerSettings = { navController.navigate("settings/player") }
            )
        }
        
        composable("settings/player") {
            PlayerSettingsScreen(onBack = { navController.popBackStack() })
        }
        
        composable("settings/server") {
            ServerConfigScreen(onBack = { navController.popBackStack() })
        }
        

        
        composable("settings/metadata") {
            MetadataProvidersScreen(onBack = { navController.popBackStack() })
        }
        
        composable("settings/security") {
            SecuritySettingsScreen(onBack = { navController.popBackStack() })
        }
        
        composable("settings/account") {
            AccountSettingsScreen(onBack = { navController.popBackStack() })
        }

        composable("manage_libraries") {
            ManageLibrariesScreen(
                onBack = { navController.popBackStack() },
                onAddLibrary = { navController.navigate("create_library") },
                onEditLibrary = { id -> navController.navigate("create_library?libraryId=$id") }
            )
        }

        composable(
            route = "create_library?libraryId={libraryId}",
            arguments = listOf(navArgument("libraryId") {
                type = NavType.LongType
                defaultValue = -1L
            })
        ) {
            CreateLibraryScreen(
                onBack = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }
        
        composable(
            route = "player/{mediaId}",
            arguments = listOf(navArgument("mediaId") { type = NavType.LongType })
        ) { backStackEntry ->
            val mediaId = backStackEntry.arguments?.getLong("mediaId") ?: return@composable
            PlayerScreen(
                mediaId = mediaId,
                onBack = { navController.popBackStack() },
                onNextEpisode = { nextId ->
                    navController.navigate("player/$nextId") {
                        popUpTo("player/$mediaId") { inclusive = true }
                    }
                }
            )
        }

        composable(
            "reader/{id}",
            arguments = listOf(navArgument("id") { type = NavType.LongType })
        ) {
            val id = it.arguments?.getLong("id") ?: return@composable
            ReaderScreen(
                mediaId = id, 
                onBack = { navController.popBackStack() },
                onNextChapter = { nextId ->
                    navController.navigate("reader/$nextId") {
                        popUpTo("reader/$id") { inclusive = true }
                    }
                }
            )
        }


        composable(
            route = "library/{libId}/{libName}/{libType}",
            arguments = listOf(
                navArgument("libId") { type = NavType.LongType },
                navArgument("libName") { type = NavType.StringType },
                navArgument("libType") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val libId = backStackEntry.arguments?.getLong("libId") ?: return@composable
            val libName = URLDecoder.decode(backStackEntry.arguments?.getString("libName") ?: "", StandardCharsets.UTF_8.toString())
            val libType = backStackEntry.arguments?.getString("libType") ?: "movies"
            LibraryScreen(
                libraryId = libId,
                libraryName = libName,
                libraryType = libType,
                onPlayMedia = { id, _ -> 
                    val t = libType.lowercase()
                    if (t == "other" || t == "music_videos") {
                        navController.navigate("player/$id")
                    } else if (t == "books") {
                        navController.navigate("book/$id")
                    } else {
                        navController.navigate("movie/$id")
                    }
                },
                onOpenSeries = { seriesId, libType ->
                    if (libType.lowercase() == "books") {
                        navController.navigate("comicseries/$seriesId")
                    } else {
                        navController.navigate("series/$seriesId/detail")
                    }
                },
                onOpenCard = { card ->
                    when (card.kind) {
                        "artist" -> navController.navigate("artist/${card.id}")
                        "album" -> navController.navigate("album/${card.id}")
                        "music_video" -> navController.navigate("player/${card.id}")
                        else -> navController.navigate("movie/${card.id}")
                    }
                },
                onPlaySong = { navController.navigate("music_player") },
                onOpenPlaylist = { playlistId -> navController.navigate("playlist/$playlistId") },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "artist/{id}",
            arguments = listOf(navArgument("id") { type = NavType.LongType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getLong("id") ?: return@composable
            ArtistDetailScreen(
                artistId = id,
                onOpenAlbum = { albumId -> navController.navigate("album/$albumId") },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "album/{id}",
            arguments = listOf(navArgument("id") { type = NavType.LongType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getLong("id") ?: return@composable
            AlbumDetailScreen(
                albumId = id,
                onPlayTrack = { navController.navigate("music_player") },
                onBack = { navController.popBackStack() }
            )
        }

        composable("music_player") {
            MusicPlayerScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "playlist/{id}",
            arguments = listOf(navArgument("id") { type = NavType.LongType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getLong("id") ?: return@composable
            org.knp.vortex.ui.screens.music.PlaylistDetailScreen(
                playlistId = id,
                onPlayTrack = { navController.navigate("music_player") },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "movie/{mediaId}",
            arguments = listOf(navArgument("mediaId") { type = NavType.LongType })
        ) { backStackEntry ->
            val mediaId = backStackEntry.arguments?.getLong("mediaId") ?: return@composable
            MovieDetailScreen(
                mediaId = mediaId,
                onPlay = { id -> navController.navigate("player/$id") },
                onBack = { navController.popBackStack() },
                onIdentify = { id, title, mediaType ->
                    val encodedTitle = URLEncoder.encode(title ?: "", StandardCharsets.UTF_8.toString())
                    val encodedType = URLEncoder.encode(mediaType ?: "movie", StandardCharsets.UTF_8.toString())
                    navController.navigate("identify/$id/$encodedTitle/$encodedType")
                }
            )
        }

        composable(
            route = "identify/{mediaId}/{title}/{mediaType}?seriesName={seriesName}",
            arguments = listOf(
                navArgument("mediaId") { type = NavType.LongType },
                navArgument("title") { type = NavType.StringType },
                navArgument("mediaType") { type = NavType.StringType },
                navArgument("seriesName") { 
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val mediaId = backStackEntry.arguments?.getLong("mediaId") ?: return@composable
            val title = URLDecoder.decode(backStackEntry.arguments?.getString("title") ?: "", StandardCharsets.UTF_8.toString())
            val mediaType = URLDecoder.decode(backStackEntry.arguments?.getString("mediaType") ?: "", StandardCharsets.UTF_8.toString())
            val seriesName = backStackEntry.arguments?.getString("seriesName")?.let {
                URLDecoder.decode(it, StandardCharsets.UTF_8.toString())
            }
            IdentifyScreen(
                mediaId = mediaId,
                initialTitle = title,
                mediaType = mediaType,
                seriesName = seriesName,
                onBack = { navController.popBackStack() },
                onIdentified = { navController.popBackStack() }
            )
        }

        composable(
            route = "series/{seriesId}/detail",
            arguments = listOf(navArgument("seriesId") { type = NavType.LongType })
        ) { _ ->
            SeriesDetailScreen(
                onBack = { navController.popBackStack() },
                onIdentify = { seriesId, name ->
                    val encodedTitle = URLEncoder.encode(name, StandardCharsets.UTF_8.toString())
                    navController.navigate("identify/$seriesId/$encodedTitle/series")
                },
                onPlayEpisode = { id, filePath ->
                    val ext = filePath.substringAfterLast('.', "").lowercase()
                    if (ext == "cbz" || ext == "epub" || ext == "pdf") {
                        navController.navigate("reader/$id")
                    } else {
                        navController.navigate("player/$id")
                    }
                }
            )
        }

        composable(
            route = "book/{mediaId}",
            arguments = listOf(navArgument("mediaId") { type = NavType.LongType })
        ) { backStackEntry ->
            val mediaId = backStackEntry.arguments?.getLong("mediaId") ?: return@composable
            org.knp.vortex.ui.screens.book.BookDetailScreen(
                mediaId = mediaId,
                onRead = { id -> navController.navigate("reader/$id") },
                onBack = { navController.popBackStack() }
            )
        }
        
        composable(
            route = "comicseries/{seriesId}",
            arguments = listOf(navArgument("seriesId") { type = NavType.LongType })
        ) { _ ->
            org.knp.vortex.ui.screens.comic.ComicSeriesDetailScreen(
                onBack = { navController.popBackStack() },
                onReadChapter = { id -> navController.navigate("reader/$id") }
            )
        }
    }
}
}

