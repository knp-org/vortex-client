package org.knp.vortex.ui.screens.reader

import android.annotation.SuppressLint
import android.graphics.Color
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.data.repository.SettingsRepository
import javax.inject.Inject

enum class ReaderFormat { PDF, WEB, CBZ }

enum class ReadingStyle { HORIZONTAL_LTR, HORIZONTAL_RTL, VERTICAL, WEBTOON }

@HiltViewModel
class ReaderViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val mediaRepository: MediaRepository,
) : ViewModel() {
    fun getServerUrl(): String = settingsRepository.getServerUrl()
    fun getAuthToken(): String? = settingsRepository.getAuthToken()

    private val _format = MutableStateFlow<ReaderFormat?>(null)
    val format: StateFlow<ReaderFormat?> = _format.asStateFlow()

    private val _title = MutableStateFlow<String?>(null)
    val title: StateFlow<String?> = _title.asStateFlow()

    private val _pageCount = MutableStateFlow(0)
    val pageCount: StateFlow<Int> = _pageCount.asStateFlow()

    private val _readingStyle = MutableStateFlow(ReadingStyle.HORIZONTAL_LTR)
    val readingStyle: StateFlow<ReadingStyle> = _readingStyle.asStateFlow()

    private val _nextChapterId = MutableStateFlow<Long?>(null)
    val nextChapterId: StateFlow<Long?> = _nextChapterId.asStateFlow()

    private val _seriesName = MutableStateFlow<String?>(null)
    val seriesName: StateFlow<String?> = _seriesName.asStateFlow()

    fun updateReadingStyle(mediaId: Long, style: ReadingStyle) {
        _readingStyle.value = style
        val identifier = _seriesName.value ?: mediaId.toString()
        settingsRepository.setReadingStyle(identifier, style.name)
        viewModelScope.launch {
            // Update server with the new reading style. 
            // We pass the current page (if available) or just 0, and the new style.
            mediaRepository.updateProgress(mediaId, 0, _pageCount.value.toLong(), style.name)
        }
    }

    fun loadReadingStyle(mediaId: Long, seriesIdentifier: String?) {
        viewModelScope.launch {
            // 1. Try fetching from server first
            mediaRepository.getProgress(mediaId)
                .onSuccess { progressDto ->
                    val serverStyle = progressDto.reading_style
                    if (!serverStyle.isNullOrEmpty()) {
                        val style = try {
                            ReadingStyle.valueOf(serverStyle)
                        } catch (e: Exception) {
                            ReadingStyle.HORIZONTAL_LTR
                        }
                        _readingStyle.value = style
                        val identifierToSave = seriesIdentifier ?: mediaId.toString()
                        settingsRepository.setReadingStyle(identifierToSave, style.name)
                        return@onSuccess
                    }
                    loadLocalReadingStyle(seriesIdentifier ?: mediaId.toString())
                }
                .onFailure {
                    loadLocalReadingStyle(seriesIdentifier ?: mediaId.toString())
                }
        }
    }

    private fun loadLocalReadingStyle(identifier: String) {
        val styleStr = settingsRepository.getReadingStyle(identifier)
        val style = try {
            ReadingStyle.valueOf(styleStr)
        } catch (e: Exception) {
            ReadingStyle.HORIZONTAL_LTR
        }
        _readingStyle.value = style
    }

    /** PDFs render natively; everything else (epub/cbz) falls back to the web reader. */
    fun resolveFormat(id: Long) {
        if (_format.value != null) return
        viewModelScope.launch {
            mediaRepository.getBookInfo(id)
                .onSuccess { info ->
                    _title.value = info.title
                    _pageCount.value = info.page_count?.toInt() ?: 0
                    _format.value = when (info.format.lowercase()) {
                        "pdf" -> ReaderFormat.PDF
                        "cbz" -> ReaderFormat.CBZ
                        else -> ReaderFormat.WEB
                    }
                }
                .onFailure {
                    // Fallback to web reader if API fails
                    _format.value = ReaderFormat.WEB
                }
            
            // Fetch media details to get series name
            mediaRepository.getMediaDetails(id).onSuccess { details ->
                val sName = details.series_name
                _seriesName.value = sName
                
                loadReadingStyle(id, sName)
                
                val currentEpisode = details.episode_number
                val seriesId = details.series_id
                if (seriesId != null && currentEpisode != null) {
                    mediaRepository.getSeasonEpisodes(seriesId, 1).onSuccess { chapters ->
                        // Find the chapter with the next highest episode number
                        val nextChapter = chapters
                            .filter { it.episode_number > currentEpisode }
                            .minByOrNull { it.episode_number }
                        
                        _nextChapterId.value = nextChapter?.id
                    }
                }
            }.onFailure {
                loadReadingStyle(id, null)
            }
        }
    }
}

@Composable
fun ReaderScreen(
    mediaId: Long,
    onBack: () -> Unit,
    onNextChapter: (Long) -> Unit = {},
    viewModel: ReaderViewModel = hiltViewModel(),
) {
    val format by viewModel.format.collectAsState()
    val title by viewModel.title.collectAsState()

    LaunchedEffect(mediaId) { viewModel.resolveFormat(mediaId) }

    when (format) {
        null -> Box(
            modifier = Modifier
                .fillMaxSize()
                .background(androidx.compose.ui.graphics.Color.Black),
        ) {
            CircularProgressIndicator(
                color = androidx.compose.ui.graphics.Color.White,
                modifier = Modifier.align(Alignment.Center),
            )
        }
        ReaderFormat.PDF -> PdfReaderScreen(mediaId = mediaId, title = title, onBack = onBack)
        ReaderFormat.CBZ -> CbzReaderScreen(mediaId = mediaId, viewModel = viewModel, onBack = onBack, onNextChapter = onNextChapter)
        ReaderFormat.WEB -> WebBookReader(mediaId = mediaId, viewModel = viewModel)
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun WebBookReader(
    mediaId: Long,
    viewModel: ReaderViewModel,
) {
    val serverUrl = viewModel.getServerUrl()
    val authToken = viewModel.getAuthToken()

    // We append a timestamp to force the webview to reload and allow our injected localstorage to take effect
    var loadAttempt by remember { mutableStateOf(0) }

    Scaffold(
        containerColor = androidx.compose.ui.graphics.Color.Black
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(androidx.compose.ui.graphics.Color.Black)
        ) {
            AndroidView(
                factory = { context ->
                    // Surface JS errors / network failures from the web reader so a
                    // blank screen can be diagnosed via `adb logcat -s ReaderWebView`
                    // (or chrome://inspect once contents debugging is on).
                    WebView.setWebContentsDebuggingEnabled(true)
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.mediaPlaybackRequiresUserGesture = false
                        setBackgroundColor(Color.BLACK)

                        // Log JS console output (errors, our injected logs, pdf.js/epub.js).
                        webChromeClient = object : WebChromeClient() {
                            override fun onConsoleMessage(msg: ConsoleMessage): Boolean {
                                Log.d(
                                    "ReaderWebView",
                                    "[${msg.messageLevel()}] ${msg.message()} @${msg.sourceId()}:${msg.lineNumber()}",
                                )
                                return true
                            }
                        }
                        settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

                        webViewClient = object : WebViewClient() {
                            override fun onReceivedError(
                                view: WebView,
                                request: WebResourceRequest,
                                error: WebResourceError,
                            ) {
                                super.onReceivedError(view, request, error)
                                Log.e(
                                    "ReaderWebView",
                                    "load error ${error.errorCode} ${error.description} for ${request.url}",
                                )
                            }

                            override fun onPageFinished(view: WebView, url: String?) {
                                super.onPageFinished(view, url)

                                val js = """
                                    (function() {
                                        var currentToken = localStorage.getItem('auth_token');
                                        var isLogin = window.location.href.includes('/login');

                                        if (currentToken !== '$authToken') {
                                            localStorage.setItem('auth_token', '$authToken');
                                            localStorage.setItem('server_url', '$serverUrl');
                                        }

                                        if (isLogin) {
                                            window.location.replace('$serverUrl/reader/$mediaId');
                                        } else if (currentToken !== '$authToken') {
                                            window.location.reload();
                                        }
                                    })();
                                """.trimIndent()

                                view.evaluateJavascript(js, null)
                            }
                        }
                    }
                },
                update = { webView ->
                    if (loadAttempt == 0) {
                        webView.loadUrl("$serverUrl/reader/$mediaId")
                        loadAttempt++
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
