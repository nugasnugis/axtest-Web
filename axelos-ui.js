(() => {

    "use strict";


    /*
     * This timer is a visual indicator only.
     *
     * The actual shutdown decision is made by
     * axelos_proxy.py on the runner.
     */

    const MAX_INACTIVITY =
        15 * 60;

    const WARNING_TIME =
        2 * 60;


    let lastActivity =
        Date.now();


    function reportLocalActivity() {

        lastActivity =
            Date.now();

    }


    /*
     * These events correspond to normal
     * human interaction with noVNC.
     */

    const events = [
        "mousemove",
        "mousedown",
        "mouseup",
        "keydown",
        "keyup",
        "wheel",
        "touchstart",
        "touchmove",
        "touchend"
    ];


    events.forEach(
        event => {

            window.addEventListener(
                event,
                reportLocalActivity,
                {
                    passive: true
                }
            );

        }
    );


    function formatTime(
        seconds
    ) {

        seconds =
            Math.max(
                0,
                seconds
            );

        const minutes =
            Math.floor(
                seconds / 60
            );

        const secs =
            seconds % 60;

        return (
            String(minutes)
                .padStart(2, "0")
            +
            ":"
            +
            String(secs)
                .padStart(2, "0")
        );

    }


    function updateUI() {

        const elapsed =
            Math.floor(
                (
                    Date.now()
                    -
                    lastActivity
                ) / 1000
            );

        const remaining =
            MAX_INACTIVITY
            -
            elapsed;


        const timer =
            document.getElementById(
                "axelos-inactivity"
            );

        if (timer) {

            timer.textContent =
                formatTime(
                    remaining
                );

        }


        const warning =
            document.getElementById(
                "axelos-warning"
            );

        const warningText =
            document.getElementById(
                "axelos-warning-text"
            );


        if (
            remaining > 0 &&
            remaining <= WARNING_TIME
        ) {

            warning.classList.add(
                "visible"
            );

            warningText.textContent =
                "The AxelOS session will "
                +
                "automatically shut down in "
                +
                formatTime(
                    remaining
                )
                +
                " because of inactivity.";

        } else {

            warning.classList.remove(
                "visible"
            );

        }

    }


    /*
     * Create AxelOS UI.
     */

    const topbar =
        document.createElement(
            "div"
        );

    topbar.id =
        "axelos-topbar";

    topbar.innerHTML = `

        <div class="axelos-brand">

            <div class="axelos-logo">
                AX
            </div>

            <div>

                <div class="axelos-brand-name">
                    AXELOS
                </div>

                <div class="axelos-brand-subtitle">
                    CLOUD DESKTOP
                </div>

            </div>

        </div>


        <div class="axelos-session">

            <span class="axelos-online-dot"></span>

            <span>
                ONLINE
            </span>

            <span class="axelos-session-divider"></span>

            <span>
                IDLE
            </span>

            <strong id="axelos-inactivity">
                15:00
            </strong>

        </div>
    `;


    const warning =
        document.createElement(
            "div"
        );

    warning.id =
        "axelos-warning";

    warning.innerHTML = `

        <div class="axelos-warning-icon">
            !
        </div>

        <div>

            <div class="axelos-warning-title">
                Inactivity shutdown
            </div>

            <div
                class="axelos-warning-text"
                id="axelos-warning-text"
            >
                The AxelOS session will
                automatically shut down soon.
            </div>

        </div>
    `;


    const loading =
        document.createElement(
            "div"
        );

    loading.id =
        "axelos-loading";

    loading.innerHTML = `

        <div class="axelos-loader"></div>

        <div class="axelos-loading-title">
            AXELOS
        </div>

        <div class="axelos-loading-subtitle">
            CLOUD DESKTOP
        </div>

        <div id="axelos-loading-status">
            Connecting to virtual machine...
        </div>
    `;


    document.body.prepend(
        loading
    );

    document.body.appendChild(
        topbar
    );

    document.body.appendChild(
        warning
    );


    /*
     * Wait for noVNC to initialize.
     */

    setTimeout(
        () => {

            loading.classList.add(
                "hidden"
            );

        },
        2500
    );


    setInterval(
        updateUI,
        1000
    );


    console.log(
        "[AxelOS] Cloud Desktop UI loaded."
    );

})();
