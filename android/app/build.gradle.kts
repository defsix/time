import org.gradle.api.tasks.Exec

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The Android app has no UI of its own for the globe/clock/etc: it ships the
// existing React/Three.js web app (../.. from here) as its assets and shows it
// in a WebView. These tasks build that web app and copy the output in before
// every Android build, so the two never drift out of sync.
val webAppDir = rootDir.parentFile
val webAssetsOutput = layout.projectDirectory.dir("src/main/assets/www")

val npmInstall by tasks.registering(Exec::class) {
    workingDir = webAppDir
    commandLine("npm", "ci")
    inputs.file(webAppDir.resolve("package-lock.json"))
    outputs.dir(webAppDir.resolve("node_modules"))
}

val buildWebApp by tasks.registering(Exec::class) {
    dependsOn(npmInstall)
    workingDir = webAppDir
    commandLine("npm", "run", "build:android")
    inputs.dir(webAppDir.resolve("src"))
    inputs.file(webAppDir.resolve("index.html"))
    inputs.dir(webAppDir.resolve("public"))
    outputs.dir(webAppDir.resolve("dist-android"))
}

val syncWebAssets by tasks.registering(Sync::class) {
    dependsOn(buildWebApp)
    from(webAppDir.resolve("dist-android"))
    into(webAssetsOutput)
}

tasks.named("preBuild") {
    dependsOn(syncWebAssets)
}

android {
    namespace = "io.defsix.time"
    compileSdk = 34

    defaultConfig {
        applicationId = "io.defsix.time"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.webkit:webkit:1.11.0")
}
