import { createVNode, defineComponent, onMounted, onUnmounted, ref, render, Transition, VNode, watchEffect } from "vue";
import "./index.scss";

const Confirm = defineComponent({
    name: "Confirm",
    props: {
        visible: Boolean,
        okText: String,
        cancleText: String,
        title: String,
        showMask: Boolean,
        hiddenCancle: Boolean,
        isBrand: Boolean,
        maskClose: {
            type: Boolean,
            default: true
        }
    },
    emits: ["close", "ok"],
    slots: ["default"],
    setup(props, { emit, slots }) {
        const dialogVisible = ref(false);
        watchEffect(() => {
            if (typeof props.visible === "boolean") {
                if (props.visible) {
                    toggleScroll();
                    setTimeout(() => (dialogVisible.value = true));
                } else {
                    toggleScroll(false);
                    dialogVisible.value = false;
                }
            } else {
                toggleScroll(false);
                dialogVisible.value = false;
            }
        });

        onUnmounted(() => toggleScroll(false));

        function toggleScroll(isBan: boolean = true) {
            if (!__isBrowser__) return;
            if (isBan) {
                document.body.classList.add("overflow-hidden");
            } else {
                document.body.classList.remove("overflow-hidden");
            }
        }

        const hancleClose = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            emit("close");
        };
        const handleOk = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            emit("ok");
        };
        return () => <Transition>
            {
                props.visible && <div class={"qoo_confirm"} onClick={e => {
                    if (props?.maskClose) hancleClose(e);
                }} >
                    { props?.showMask && <div class={"qoo_confirm__mask"} /> }
                    <Transition name="zoom">
                        {
                            dialogVisible.value && <>
                                <div class={`qoo_confirm__dialog ${!!props.isBrand && "brand"}`}>
                                    {
                                        props.title && <div class={"qoo_confirm__dialog__header"}>
                                            { props.title }
                                        </div>
                                    }

                                    <div class={"qoo_confirm__dialog__body"}>
                                        { slots?.default?.() }
                                    </div>

                                    <div class={"qoo_confirm__dialog__footer"}>
                                        {
                                            !props.hiddenCancle ? <button class={"qoo_confirm__dialog__btn--cancle btn"} onClick={e => hancleClose(e)} >
                                                { props.cancleText || "Cancle" }
                                            </button> : null
                                        }

                                        <button class={"qoo_confirm__dialog__btn--ok btn"} onClick={e => handleOk(e)}>
                                            { props.okText || "Ok" }
                                        </button>
                                    </div>
                                </div>
                            </>
                        }
                    </Transition>
                </div>
            }
        </Transition>;
    }
});

export default Confirm as typeof Confirm & {
    $dialog: (props: IConfirm) => void;
};

const __isBrowser__ = true;

interface IConfirm {
    title?: string;
    okText?: string;
    cancleText?: string;
    content?: string | VNode;
    showMask?: boolean;
    maskClose?: boolean;
    hiddenCancle?: boolean;
    isBrand?: boolean;
    onCancle?: () => boolean | Promise<boolean> | any;
    onOk?: () => boolean | Promise<boolean> | any;
}
let rooContainer: any;
export const dialog = (props: IConfirm = {}) => {
    if (!__isBrowser__) return;

    if (!rooContainer) {
        rooContainer = document.createElement("div");
        document.body.appendChild(rooContainer);
    }

    const handleClose = async () => {
        await props?.onCancle?.();
        render(null, rooContainer);
    };

    const handleOk = async () => {
        await props?.onOk?.();
        render(null, rooContainer);
    };

    // 销毁组件
    const updateRouteDestroy = () => {
        render(null, rooContainer);
        window.removeEventListener("popstate", updateRouteDestroy);
    };
    window.addEventListener("popstate", updateRouteDestroy);

    render(createVNode(defineComponent({
        setup() {
            // const { t } = useI18n();
            const visible = ref(false);
            const emitClose = async () => {
                visible.value = false;
                await setTimeout(() => null);
            };
            onMounted(() => {
                visible.value = true;
            });
            return () => <Confirm
                title={props?.title}
                visible={visible.value}
                showMask={props?.showMask}
                maskClose={props?.maskClose === undefined ? true : props?.maskClose}
                okText={props?.okText}
                cancleText={props?.cancleText}
                hiddenCancle={props?.hiddenCancle}
                isBrand={props?.isBrand}
                onClose={async () => {
                    await emitClose();
                    handleClose();
                }}
                onOk={async () => {
                    await emitClose();
                    handleOk();
                }}
            >
                { props?.content }
            </Confirm>;
        }
    })), rooContainer);
};
Confirm.$dialog = dialog;
