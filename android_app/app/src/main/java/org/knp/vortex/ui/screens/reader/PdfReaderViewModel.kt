package org.knp.vortex.ui.screens.reader

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.knp.vortex.data.repository.MediaRepository
import org.knp.vortex.data.repository.SettingsRepository
import java.io.File
import javax.inject.Inject

enum class PdfReadingMode { Vertical, Horizontal }

data class PdfReaderState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val pageCount: Int = 0,
    val currentPage: Int = 0,
    val initialPage: Int = 0,
    val readingMode: PdfReadingMode = PdfReadingMode.Vertical,
)

/**
 * Renders a PDF natively with [PdfRenderer] instead of pushing the raw file
 * through pdf.js in a WebView. The raw `/file` bytes are downloaded once to the
 * cache, opened as a seekable descriptor, and pages are rasterized to bitmaps on
 * demand. This avoids the System-WebView/pdf.js compatibility blank-screen and
 * works on every device back to the app's minSdk.
 */
@HiltViewModel
class PdfReaderViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val httpClient: OkHttpClient,
    private val settingsRepository: SettingsRepository,
    private val mediaRepository: MediaRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(PdfReaderState())
    val state: StateFlow<PdfReaderState> = _state.asStateFlow()

    // PdfRenderer allows only one open page at a time and is not thread-safe,
    // so every render is serialized through this lock.
    private val renderLock = Mutex()
    private var renderer: PdfRenderer? = null
    private var descriptor: ParcelFileDescriptor? = null
    private var tempFile: File? = null
    private var mediaId: Long = -1L

    fun load(id: Long) {
        if (mediaId == id && renderer != null) return
        mediaId = id
        viewModelScope.launch {
            _state.value = PdfReaderState(isLoading = true)
            val restored = mediaRepository.getProgress(id).getOrNull()?.position?.toInt() ?: 0
            val result = withContext(Dispatchers.IO) { runCatching { openRenderer(id) } }
            result
                .onSuccess { count ->
                    val start = restored.coerceIn(0, (count - 1).coerceAtLeast(0))
                    _state.value = PdfReaderState(
                        isLoading = false,
                        pageCount = count,
                        currentPage = start,
                        initialPage = start,
                    )
                }
                .onFailure { e ->
                    Log.e("PdfReader", "Failed to open PDF $id", e)
                    _state.value = PdfReaderState(isLoading = false, error = e.message ?: "Failed to open PDF")
                }
        }
    }

    private fun openRenderer(id: Long): Int {
        val base = settingsRepository.getServerUrl().trimEnd('/')
        val url = "$base/api/v1/books/$id/file"
        val request = Request.Builder().url(url).build()
        val file = File.createTempFile("book_${id}_", ".pdf", context.cacheDir)
        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                file.delete()
                throw IllegalStateException("Server returned ${response.code}")
            }
            val body = response.body ?: run {
                file.delete()
                throw IllegalStateException("Empty response body")
            }
            file.outputStream().use { out -> body.byteStream().copyTo(out) }
        }
        val pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
        val r = PdfRenderer(pfd)
        tempFile = file
        descriptor = pfd
        renderer = r
        return r.pageCount
    }

    /** Rasterize [index] to a bitmap [widthPx] wide, preserving aspect ratio. */
    suspend fun renderPage(index: Int, widthPx: Int): Bitmap? = withContext(Dispatchers.IO) {
        val r = renderer ?: return@withContext null
        if (index < 0 || index >= r.pageCount || widthPx <= 0) return@withContext null
        renderLock.withLock {
            runCatching {
                val page = r.openPage(index)
                try {
                    val scale = widthPx.toFloat() / page.width
                    val heightPx = (page.height * scale).toInt().coerceAtLeast(1)
                    val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
                    // PDFs assume white paper; the renderer composites onto transparency.
                    bitmap.eraseColor(Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    bitmap
                } finally {
                    page.close()
                }
            }.getOrNull()
        }
    }

    fun setPage(index: Int) {
        val count = _state.value.pageCount
        if (count == 0) return
        val safe = index.coerceIn(0, count - 1)
        if (safe == _state.value.currentPage) return
        _state.value = _state.value.copy(currentPage = safe)
        viewModelScope.launch {
            mediaRepository.updateProgress(mediaId, safe.toLong(), count.toLong())
        }
    }

    fun setReadingMode(mode: PdfReadingMode) {
        _state.value = _state.value.copy(readingMode = mode)
    }

    override fun onCleared() {
        super.onCleared()
        runCatching { renderer?.close() }
        runCatching { descriptor?.close() }
        runCatching { tempFile?.delete() }
        renderer = null
        descriptor = null
        tempFile = null
    }
}
