package com.mpv.quran_potd;

import android.os.Bundle;
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
}
