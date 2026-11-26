(() => {
  "use strict";

  const images = {
    "kvm": "kvm.png",
    "stratovirt": "stratovirt.png",
    "docker": "docker.png",
    "isulad": "isulad.png",
    "kubernetes": "kubernetes.png",
    "helm": "helm.png",
    "istio": "istio.png",
    "prometheus": "prometheus.png",
    "grafana": "grafana.png",
    "opencv": "opencv.png",
    "ffmpeg": "ffmpeg.png",
    "scikit-learn": "scikit-learn.png",
    "apache-spark-mllib": "spark.png",
    "cntk": "cntk.png",
    "deeplearning4j": "deeplearning4j.png",
    "apache-mahout": "apache-mahout.png",
    "pytorch": "pytorch.png",
    "mxnet": "mxnet.png",
    "caffe": "caffe.png",
    "hadoop": "hadoop.png",
    "openssl": "openssl.png",
    "musl-libc": "musl-libc.png",
    "openssh": "openssh.png",
    "glibc": "glibc.png",
    "openjdk": "openjdk.png",
    "python": "python.png",
    "go": "go.png",
    "openblas": "openblas.png",
    "tensorflow": "tensorflow.png",
    "mnn": "mnn.png",
    "onnx": "onnx.png",
    "vllm": "vllm.png",
    "vulkan": "vulkan.png",
    "flink": "flink.png",
    "mysql": "mysql.png",
    "mariadb": "mariadb.png",
    "storm": "storm.png",
    "postgresql": "postgresql.png",
    "elasticsearch": "elasticsearch.png",
    "tez": "tez.png",
    "kafka": "kafka.png",
    "redis": "redis.png",
    "spark": "spark.png",
    "zookeeper": "zookeeper.png",
    "onnx-runtime": "onnx-runtime.png",
    "pixman": "pixman.png",
    "numpy": "numpy.png",
    "nginx": "nginx.png",
    "uefi": "uefi.png",
    "opensbi": "opensbi.png",
    "linux-kernel": "linux-kernel.png",
    "gcc": "gcc.png",
    "llvm": "llvm.png",
    "qemu": "qemu.png",
    "spike": "spike.png",
    "gdb": "gdb.png",
    "opengauss": "opengauss.png"
  };
  const abbreviations = {
    "faiss": "FA",
    "onednn": "DNN"
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  window.renderSoftwareMark = function renderSoftwareMark(software, className) {
    const file = Object.hasOwn(images, software.id) ? images[software.id] : null;
    const abbreviation = Object.hasOwn(abbreviations, software.id)
      ? abbreviations[software.id] : software.mark;

    return file
      ? `<span class="${className} has-logo" aria-hidden="true"><img class="software-logo" src="logos/${file}" alt=""></span>`
      : `<span class="${className}" aria-hidden="true">${escapeHtml(abbreviation)}</span>`;
  };
})();
