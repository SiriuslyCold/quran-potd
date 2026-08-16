package com.mpv.quran_potd;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable edge-to-edge support for all Android versions
        EdgeToEdge.enable(this);
        registerPlugin(BuildInfoPlugin.class);
    }
}

@CapacitorPlugin(name = "BuildInfo")
class BuildInfoPlugin extends Plugin {
    @PluginMethod
    public void getBuildFlavor(PluginCall call) {
        String flavor = getContext().getString(R.string.build_flavor);
        JSObject ret = new JSObject();
        ret.put("flavor", flavor);
        call.resolve(ret);
    }

    @PluginMethod
    public void setStatusBarStyle(PluginCall call) {
        String style = call.getString("style"); // "DARK" or "LIGHT"
        if (style == null) {
            call.reject("Style parameter is missing");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                    getActivity().getWindow(),
                    getActivity().getWindow().getDecorView()
                );
                if (controller != null) {
                    // "DARK" means light icons/text (white) for dark backgrounds.
                    // "LIGHT" means dark icons/text (black) for light backgrounds.
                    // controller.setAppearanceLightStatusBars(true) makes status bar icons dark.
                    controller.setAppearanceLightStatusBars("LIGHT".equals(style));
                    call.resolve();
                } else {
                    call.reject("WindowInsetsControllerCompat is null");
                }
            } catch (Exception e) {
                call.reject("Failed to set status bar style: " + e.getMessage());
            }
        });
    }
}
