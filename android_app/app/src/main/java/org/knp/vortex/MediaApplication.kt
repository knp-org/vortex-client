package org.knp.vortex

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import okhttp3.OkHttpClient
import javax.inject.Inject

@HiltAndroidApp
class MediaApplication : Application(), coil.ImageLoaderFactory {

    @Inject
    lateinit var okHttpClient: OkHttpClient

    override fun newImageLoader(): coil.ImageLoader {
        return coil.ImageLoader.Builder(this)
            .okHttpClient(okHttpClient)
            .components {
                add(coil.decode.VideoFrameDecoder.Factory())
            }
            .crossfade(true)
            .build()
    }
}
