# Android runtime license provenance

Prepared 2026-09-05. Canonical notices are stored alongside this document in `android-runtime.txt`; `scripts/licenses.mjs` includes them in the offline license asset.

## Coverage

The 46 external runtime components were read from the `<package>` section of
`android/app/build/intermediates/lint_report_lint_model/release/generateReleaseLintReportModel/release-artifact-dependencies.xml`.
Every corresponding cached AAR/JAR was inspected, including nested JARs, for filenames containing LICENSE, NOTICE, or COPYRIGHT. Build plugins and test-only dependencies were not treated as runtime components. The four local Capacitor projects are covered by the existing MIT notices maintained by the root task.

Several AndroidX AARs carry one identical complete Apache license file. Its SHA-256 is
`809fa1ed21450f59827d1e9aec720bbc4b687434fa22283c6cb5dd82a47ab9c0`, identical to the official AndroidX root license retrieved here. No additional AndroidX NOTICE text was found inside these runtime AARs or nested JARs.

Cordova's binary AAR lacks LICENSE/NOTICE entries, so both complete texts were obtained from the exact upstream `14.0.1` tag. Kotlin's exact-version copyright/license and its standard-library GWT, Guava, and Boost licensing references were inspected. The Boost text is included. The Kotlin upstream NOTICE names the **compiler distribution**, which is not a runtime component here, so it was not represented as a shipped compiler notice. The exact coroutines library NOTICE is included. Guava ListenableFuture licensing was verified through its actual parent POM and the header in the exact published 1.0 source JAR.

## Remaining integration gates

- Integrated into `public/third-party-licenses.txt` through the reproducible notice-generation script.
- After dependency changes or final release packaging, compare the resolved runtime component set with the inventory and rerun the check for newly added packages/notices.
- Final APK and AAB notice assets were verified byte-for-byte against the production web asset. Offline Licenses navigation passed on the installed Android phone/tablet test package.
- Retain the already prepared Phaser/Capacitor MIT and font OFL texts; retain the separate Electron/Chromium notices in desktop packages. Artwork provenance and store AI declarations remain separate release checks.

No missing license identifier or required fetched text remains for the component inventory inspected here. This is a component/text inventory, not a store-review outcome or a legal opinion on unrelated assets.

## Exact runtime component license metadata

| Component | License declared by publisher | Primary metadata |
| --- | --- | --- |
| `androidx.activity:activity:1.11.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/activity/activity/1.11.0/activity-1.11.0.pom) |
| `androidx.annotation:annotation-experimental:1.4.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/annotation/annotation-experimental/1.4.1/annotation-experimental-1.4.1.pom) |
| `androidx.annotation:annotation-jvm:1.8.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/annotation/annotation-jvm/1.8.1/annotation-jvm-1.8.1.pom) |
| `androidx.appcompat:appcompat-resources:1.7.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/appcompat/appcompat-resources/1.7.1/appcompat-resources-1.7.1.pom) |
| `androidx.appcompat:appcompat:1.7.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/appcompat/appcompat/1.7.1/appcompat-1.7.1.pom) |
| `androidx.arch.core:core-common:2.2.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/arch/core/core-common/2.2.0/core-common-2.2.0.pom) |
| `androidx.arch.core:core-runtime:2.2.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/arch/core/core-runtime/2.2.0/core-runtime-2.2.0.pom) |
| `androidx.collection:collection-jvm:1.4.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/collection/collection-jvm/1.4.2/collection-jvm-1.4.2.pom) |
| `androidx.concurrent:concurrent-futures:1.1.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/concurrent/concurrent-futures/1.1.0/concurrent-futures-1.1.0.pom) |
| `androidx.coordinatorlayout:coordinatorlayout:1.3.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/coordinatorlayout/coordinatorlayout/1.3.0/coordinatorlayout-1.3.0.pom) |
| `androidx.core:core-ktx:1.17.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/core/core-ktx/1.17.0/core-ktx-1.17.0.pom) |
| `androidx.core:core-splashscreen:1.2.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/core/core-splashscreen/1.2.0/core-splashscreen-1.2.0.pom) |
| `androidx.core:core-viewtree:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/core/core-viewtree/1.0.0/core-viewtree-1.0.0.pom) |
| `androidx.core:core:1.17.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/core/core/1.17.0/core-1.17.0.pom) |
| `androidx.cursoradapter:cursoradapter:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/cursoradapter/cursoradapter/1.0.0/cursoradapter-1.0.0.pom) |
| `androidx.customview:customview:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/customview/customview/1.0.0/customview-1.0.0.pom) |
| `androidx.drawerlayout:drawerlayout:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/drawerlayout/drawerlayout/1.0.0/drawerlayout-1.0.0.pom) |
| `androidx.emoji2:emoji2-views-helper:1.3.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/emoji2/emoji2-views-helper/1.3.0/emoji2-views-helper-1.3.0.pom) |
| `androidx.emoji2:emoji2:1.3.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/emoji2/emoji2/1.3.0/emoji2-1.3.0.pom) |
| `androidx.fragment:fragment:1.8.9` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/fragment/fragment/1.8.9/fragment-1.8.9.pom) |
| `androidx.interpolator:interpolator:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/interpolator/interpolator/1.0.0/interpolator-1.0.0.pom) |
| `androidx.lifecycle:lifecycle-common:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-common/2.6.2/lifecycle-common-2.6.2.pom) |
| `androidx.lifecycle:lifecycle-livedata-core:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-livedata-core/2.6.2/lifecycle-livedata-core-2.6.2.pom) |
| `androidx.lifecycle:lifecycle-livedata:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-livedata/2.6.2/lifecycle-livedata-2.6.2.pom) |
| `androidx.lifecycle:lifecycle-process:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-process/2.6.2/lifecycle-process-2.6.2.pom) |
| `androidx.lifecycle:lifecycle-runtime:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-runtime/2.6.2/lifecycle-runtime-2.6.2.pom) |
| `androidx.lifecycle:lifecycle-viewmodel-savedstate:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-viewmodel-savedstate/2.6.2/lifecycle-viewmodel-savedstate-2.6.2.pom) |
| `androidx.lifecycle:lifecycle-viewmodel:2.6.2` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/lifecycle/lifecycle-viewmodel/2.6.2/lifecycle-viewmodel-2.6.2.pom) |
| `androidx.loader:loader:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/loader/loader/1.0.0/loader-1.0.0.pom) |
| `androidx.profileinstaller:profileinstaller:1.4.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/profileinstaller/profileinstaller/1.4.0/profileinstaller-1.4.0.pom) |
| `androidx.resourceinspection:resourceinspection-annotation:1.0.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/resourceinspection/resourceinspection-annotation/1.0.1/resourceinspection-annotation-1.0.1.pom) |
| `androidx.savedstate:savedstate:1.2.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/savedstate/savedstate/1.2.1/savedstate-1.2.1.pom) |
| `androidx.startup:startup-runtime:1.1.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/startup/startup-runtime/1.1.1/startup-runtime-1.1.1.pom) |
| `androidx.tracing:tracing:1.2.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/tracing/tracing/1.2.0/tracing-1.2.0.pom) |
| `androidx.vectordrawable:vectordrawable-animated:1.1.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/vectordrawable/vectordrawable-animated/1.1.0/vectordrawable-animated-1.1.0.pom) |
| `androidx.vectordrawable:vectordrawable:1.1.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/vectordrawable/vectordrawable/1.1.0/vectordrawable-1.1.0.pom) |
| `androidx.versionedparcelable:versionedparcelable:1.1.1` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/versionedparcelable/versionedparcelable/1.1.1/versionedparcelable-1.1.1.pom) |
| `androidx.viewpager:viewpager:1.0.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/viewpager/viewpager/1.0.0/viewpager-1.0.0.pom) |
| `androidx.webkit:webkit:1.14.0` | The Apache Software License, Version 2.0 | [POM](https://dl.google.com/dl/android/maven2/androidx/webkit/webkit/1.14.0/webkit-1.14.0.pom) |
| `com.google.guava:listenablefuture:1.0` | Apache License 2.0, inherited from guava-parent:26.0-android | [POM](https://repo.maven.apache.org/maven2/com/google/guava/listenablefuture/1.0/listenablefuture-1.0.pom) |
| `org.apache.cordova:framework:14.0.1` | Apache License, Version 2.0 | [POM](https://repo.maven.apache.org/maven2/org/apache/cordova/framework/14.0.1/framework-14.0.1.pom) |
| `org.jetbrains.kotlin:kotlin-stdlib:2.0.21` | The Apache License, Version 2.0 | [POM](https://repo.maven.apache.org/maven2/org/jetbrains/kotlin/kotlin-stdlib/2.0.21/kotlin-stdlib-2.0.21.pom) |
| `org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1` | The Apache Software License, Version 2.0 | [POM](https://repo.maven.apache.org/maven2/org/jetbrains/kotlinx/kotlinx-coroutines-android/1.8.1/kotlinx-coroutines-android-1.8.1.pom) |
| `org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:1.8.1` | The Apache Software License, Version 2.0 | [POM](https://repo.maven.apache.org/maven2/org/jetbrains/kotlinx/kotlinx-coroutines-core-jvm/1.8.1/kotlinx-coroutines-core-jvm-1.8.1.pom) |
| `org.jetbrains:annotations:23.0.0` | The Apache Software License, Version 2.0 | [POM](https://repo.maven.apache.org/maven2/org/jetbrains/annotations/23.0.0/annotations-23.0.0.pom) |
| `org.jspecify:jspecify:1.0.0` | The Apache License, Version 2.0 | [POM](https://repo.maven.apache.org/maven2/org/jspecify/jspecify/1.0.0/jspecify-1.0.0.pom) |

## Retrieved source-file integrity

| File | SHA-256 | Publisher source |
| --- | --- | --- |
| `cordova-LICENSE.txt` | `401f08372facabc78d6d408a32de4f617fd9552c95e01797838c9d60a938b4da` | [Source](https://raw.githubusercontent.com/apache/cordova-android/14.0.1/LICENSE) |
| `cordova-NOTICE.txt` | `e94707080ab2781d5ba4ceac999f31db2539d2477783287969c52580b9fa84b0` | [Source](https://raw.githubusercontent.com/apache/cordova-android/14.0.1/NOTICE) |
| `kotlin-LICENSE.txt` | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/LICENSE.txt) |
| `coroutines-LICENSE.txt` | `b1febe6399dffb10d19d35e7663ab16300c93cb0476a94115df1cc0097a8ffd8` | [Source](https://raw.githubusercontent.com/Kotlin/kotlinx.coroutines/1.8.1/LICENSE.txt) |
| `annotations-LICENSE.txt` | `8c1e966c7855fb54027bcaf6ebe7a43abe4785791e8cf9148c363761d493d097` | [Source](https://raw.githubusercontent.com/JetBrains/java-annotations/23.0.0/LICENSE.txt) |
| `jspecify-LICENSE.txt` | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` | [Source](https://raw.githubusercontent.com/jspecify/jspecify/v1.0.0/LICENSE) |
| `androidx-LICENSE.txt` | `809fa1ed21450f59827d1e9aec720bbc4b687434fa22283c6cb5dd82a47ab9c0` | [Source](https://raw.githubusercontent.com/androidx/androidx/androidx-main/LICENSE.txt) |
| `kotlin-NOTICE.txt` | `0b09a83d3ef7795c7dec65e815866597c066c53898f2852a76599b8f5552941a` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/NOTICE.txt) |
| `kotlin-COPYRIGHT.txt` | `8f1a1700adb5490604c6094fb137bf73f6c28d3ee554b58f3ff8ef975a79672d` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/COPYRIGHT.txt) |
| `kotlin-license-README.md` | `8a82f8702ea943f008c84a61b8df7b053b7d36cfa293e3abd59f839b728a5999` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/README.md) |
| `coroutines-NOTICE.txt` | `421d45acbd92670b4131621a28fcbb41ba0b747d3a336cb13fca38c0685426c4` | [Source](https://raw.githubusercontent.com/Kotlin/kotlinx.coroutines/1.8.1/license/NOTICE.txt) |
| `kotlin-guava-LICENSE.txt` | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/third_party/guava_license.txt) |
| `kotlin-gwt-LICENSE.txt` | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/third_party/gwt_license.txt) |
| `kotlin-boost-LICENSE.txt` | `8d8291caf1cee26d23acf3eb67c9f9a2d58f1c681b16a4fbe8cbfb9e3c0b5a9b` | [Source](https://raw.githubusercontent.com/JetBrains/kotlin/v2.0.21/license/third_party/boost_LICENSE.txt) |

Output: `/private/tmp/dash-android-licenses.txt`

Output SHA-256: `c2a018b4b0f26fc88dc487c62b3e797dfbf16d5f096139ba30e9bf9c4fc89a2f`

Model SHA-256: `a3a20cd13d76f6662219dc416f95d50be60177af660d447bd85dfb71dc32cec4`
