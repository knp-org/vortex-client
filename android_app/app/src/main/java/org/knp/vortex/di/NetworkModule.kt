package org.knp.vortex.di

import android.content.Context
import org.knp.vortex.data.remote.DynamicBaseUrlInterceptor
import org.knp.vortex.data.remote.MediaApi
import org.knp.vortex.data.repository.HiddenContentRepository
import org.knp.vortex.data.repository.SettingsRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideSettingsRepository(@ApplicationContext context: Context): SettingsRepository {
        return SettingsRepository(context)
    }

    @Provides
    @Singleton
    fun provideHiddenContentRepository(@ApplicationContext context: Context): HiddenContentRepository {
        return HiddenContentRepository(context)
    }

    @Provides
    @Singleton
    fun provideDynamicBaseUrlInterceptor(settingsRepository: SettingsRepository): DynamicBaseUrlInterceptor {
        return DynamicBaseUrlInterceptor(settingsRepository)
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        dynamicBaseUrlInterceptor: DynamicBaseUrlInterceptor,
        authInterceptor: org.knp.vortex.data.remote.AuthInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .addInterceptor(dynamicBaseUrlInterceptor)
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        // Placeholder URL - the actual URL is set dynamically by DynamicBaseUrlInterceptor
        return Retrofit.Builder()
            .baseUrl("http://placeholder.local/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideMediaApi(retrofit: Retrofit): MediaApi {
        return retrofit.create(MediaApi::class.java)
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): org.knp.vortex.data.remote.AuthApi {
        return retrofit.create(org.knp.vortex.data.remote.AuthApi::class.java)
    }
}
