package org.ekstep.saral.saralsdk;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.ekstep.saral.saralsdk.commons.FileOps;
import org.ekstep.saral.saralsdk.hwmodel.HWBlockLettersClassifier;
import org.ekstep.saral.saralsdk.hwmodel.HWBlockLettersClassifierStatusListener;
import org.ekstep.saral.saralsdk.hwmodel.HWClassifier;
import org.ekstep.saral.saralsdk.hwmodel.HWClassifierStatusListener;
import org.ekstep.saral.saralsdk.hwmodel.RemoteConfig;
import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;

public class SaralSDKModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final String TAG             = "SrlSDK::Module";
    Promise mPromise                            = null;

    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(getReactApplicationContext()) {
        @Override
        public void onManagerConnected(int status) {
            switch (status) {
                case LoaderCallbackInterface.SUCCESS:
                {
                    Log.i(TAG, "OpenCV loaded successfully");
                } break;
                default:
                {
                    super.onManagerConnected(status);
                } break;
            }
        }
    };

    SaralSDKModule(ReactApplicationContext context) {
        super(context);

        context.addActivityEventListener(this);
        FileOps.getInstance().initialize(context);
        
        RemoteConfig remoteConfig = new RemoteConfig();
        boolean isFBDownloadModelEnable = remoteConfig.isFBDownloadModelEnable(context);	
        	
        Log.d(TAG, "SaralSDKModule loaded, trying to load OpenCV libs & Models isFBDownloadModelEnable=> "+isFBDownloadModelEnable);
        
        if (!OpenCVLoader.initDebug()) {
            Log.d(TAG, "Internal OpenCV library not found. Using OpenCV Manager for initialization");
            OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION, getReactApplicationContext(), mLoaderCallback);
        } else {
            Log.d(TAG, "OpenCV library found inside package. Using it!");
            mLoaderCallback.onManagerConnected(LoaderCallbackInterface.SUCCESS);
        }
        HWClassifier.getInstance();
        Log.d(TAG, "Loading HWClassifer models");
        HWClassifier.getInstance().initialize(new HWClassifierStatusListener() {
            @Override
            public void OnModelLoadSuccess(String message) {
                Log.d(TAG, "HWClassifer model loaded : " + message);
            }

            @Override
            public void OnModelLoadError(String message) {
                Log.d(TAG, "HWClassifer model cannot be loaded :" + message);
            }
        },isFBDownloadModelEnable, context);

        HWBlockLettersClassifier.getInstance();
        Log.d(TAG, "Loading HWBlockLettersClassifier models");
        HWBlockLettersClassifier.getInstance().initialize(new HWBlockLettersClassifierStatusListener() {
            @Override
            public void OnModelLoadSuccess(String message) {
                Log.d(TAG, "HWBlockLettersClassifier model loaded : " + message);
            }

            @Override
            public void OnModelLoadError(String message) {
                Log.d(TAG, "HWBlockLettersClassifier model cannot be loaded :" + message);
            }
        },isFBDownloadModelEnable, context);

    }

    @Override
    public String getName() {
        return "SaralSDKModule";
    }

    @ReactMethod
    void startCamera(String layoutSchema,String page, int hasTimer, boolean isManualEditEnabled, Promise promise) {
        Log.d(TAG, "startCamera called with: " + layoutSchema);
        Log.d(TAG, "startCamera called with: " + page);

        mPromise                        = promise;

        ReactApplicationContext context = getReactApplicationContext();
        Activity currentActivity        = getCurrentActivity();

        Intent intent                   = new Intent(currentActivity, SaralSDKOpenCVScannerActivity.class);
        intent.putExtra("layoutConfigs", layoutSchema);
        intent.putExtra("page", page);
        intent.putExtra("timer", hasTimer);
        intent.putExtra("isManualEditEnabled", isManualEditEnabled);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        currentActivity.startActivity(intent);
    }

    @ReactMethod
    void stopCamera(Promise promise) {
        Log.d(TAG, "stopCamera called in");
        final Activity activity = getCurrentActivity();
        activity.finish();
        promise.resolve("true");
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == 1) {
            Log.d(TAG, "Response: " + data.getStringExtra("layoutConfigsResult"));
            this.mPromise.resolve(data.getStringExtra("layoutConfigsResult"));
        } else if (requestCode == 2) {
            Log.d(TAG, "Response: " + data.getStringExtra("isModelAvailable"));
            this.mPromise.resolve(data.getStringExtra("isModelAvailable"));
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        Log.d(TAG, "SrlSDK:: onNewIntent");
    }
}
