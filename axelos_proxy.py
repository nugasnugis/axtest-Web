#!/usr/bin/env python3

import os
import time

from websockify.websocketproxy import (
    ProxyRequestHandler,
    WebSocketProxy,
)


ACTIVITY_FILE = "/tmp/axelos-last-activity"
CONNECTION_DIR = "/tmp/axelos-connections"


def ensure_state():
    os.makedirs(
        CONNECTION_DIR,
        exist_ok=True
    )

    if not os.path.exists(
        ACTIVITY_FILE
    ):
        with open(
            ACTIVITY_FILE,
            "w"
        ) as f:
            f.write(
                str(time.time())
            )


def touch_activity():
    try:
        now = str(
            time.time()
        )

        tmp = (
            ACTIVITY_FILE
            + ".tmp"
        )

        with open(
            tmp,
            "w"
        ) as f:
            f.write(now)

        os.replace(
            tmp,
            ACTIVITY_FILE
        )

    except Exception:
        pass


def connection_marker():
    return os.path.join(
        CONNECTION_DIR,
        f"connection-{os.getpid()}"
    )


class AxelProxyRequestHandler(
    ProxyRequestHandler
):

    def _mark_connection(
        self
    ):
        ensure_state()

        try:
            with open(
                connection_marker(),
                "w"
            ) as f:
                f.write(
                    str(time.time())
                )
        except Exception:
            pass


    def _remove_connection(
        self
    ):
        try:
            os.remove(
                connection_marker()
            )
        except FileNotFoundError:
            pass
        except Exception:
            pass


    def _is_user_input(
        self,
        payload
    ):
        """
        RFB client -> server message types:

          4 = KeyEvent
          5 = PointerEvent
          6 = ClientCutText
          255 = QEMU extension

        We deliberately do NOT count:

          0 = SetPixelFormat
          2 = SetEncodings
          3 = FramebufferUpdateRequest

        because those are protocol/setup traffic rather
        than direct user activity.
        """

        if not payload:
            return False

        message_type = payload[0]

        if message_type in (
            4,  # KeyEvent
            5,  # PointerEvent
            6,  # ClientCutText
            255 # QEMU extension
        ):
            return True

        return False


    def recv_frames(
        self
    ):
        bufs, closed = super().recv_frames()

        for payload in bufs:

            if self._is_user_input(
                payload
            ):
                touch_activity()

        return bufs, closed


    def new_websocket_client(
        self
    ):
        ensure_state()

        self._mark_connection()

        print(
            "[AxelOS] VNC client connected."
        )

        try:

            return super().new_websocket_client()

        finally:

            self._remove_connection()

            print(
                "[AxelOS] VNC client disconnected."
            )


    def finish(
        self
    ):
        self._remove_connection()

        return super().finish()


def main():

    ensure_state()

    web_root = os.environ.get(
        "AXELOS_WEB_ROOT",
        "/usr/share/novnc"
    )

    server = WebSocketProxy(
        RequestHandlerClass=
            AxelProxyRequestHandler,

        listen_host=
            "127.0.0.1",

        listen_port=
            8080,

        target_host=
            "127.0.0.1",

        target_port=
            5900,

        web=
            web_root,

        file_only=
            True,

        verbose=
            True,

        daemon=
            False
    )

    print(
        "[AxelOS] Starting custom noVNC/websockify proxy."
    )

    print(
        f"[AxelOS] Web root: {web_root}"
    )

    print(
        "[AxelOS] Listening on 127.0.0.1:8080"
    )

    server.start_server()


if __name__ == "__main__":
    main()
