# 提交 Bench 测试结果

从 Yuansheng Bench 下载一份 **Landscape JSON**，将原文件上传到本仓库的 `results/`，发起拉取请求（PR）。文件也可以放进软件子目录，如 `results/openblas/`。目录按 JSON 里的软件标识归集，文件名可保留下载时的名字。每次新的测试或快照单独提交，后续记录可与历史版本并存。

### 从哪里导出

| Bench 入口 | 结果内容 |
|---|---|
| 已结束的 Run → 测试结果和输出文件 → 导出 Landscape JSON | 单次 RISC-V 或 ARM 运行的实际状态、功能用例计数和性能读数。失败和取消的运行也可记录。 |
| 运行对比页 → 选择同一软件的一条 ARM 和一条 RISC-V 运行 → 导出 Landscape JSON | 两侧完整结果。每侧独立保存版本、单位、样本数和均值。详情页按用例、指标、版本和已知单位对齐两侧读数。 |
| 五维标准评级 → 评级结果 → 保存当前版本或确认评级 → 导出 Landscape JSON | 冻结修订中的评估范围、五维结果和关联运行。也可在历史回放中导出某一修订。 |

下载文件会公开展示软件名、配方、用例名、平台和版本；提交前请核对这些内容。导出器仅选取公开展示字段。原始日志、SSH 配置、环境变量、主机连接信息、复核人账号和二进制归档留在 Bench。标准快照中的平台名称来自评估时填写的目标及参考平台，请使用适合公开的名称。

### JSON v1 字段约定

[完整 JSON Schema](../docs/result-v1.schema.json) 定义必填字段、允许值及空值。三种导出共用同一格式。

| 顶层字段 | 含义 |
|---|---|
| `schema_version` | 当前为整数 `1`。不兼容的格式变更需要新版本。 |
| `software_id`、`software_name` | 稳定的小写目录标识及来源名称。已收录的软件沿用目录正式名称和分类，首次出现的软件自动列入“其他软件”。 |
| `tested_on` | ISO 日期。Run 使用结束日期或可取到的运行日期（UTC），两侧导出取较晚日期。快照取评估对象的 `as_of`。 |
| `result_id` | 内容的 SHA-256。移除本字段后，以 Python `json.dumps(body, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False)` 序列化并对 UTF-8 字节取摘要。重复上传同一导出会在 PR 检查中提示。摘要用于识别内容，提交来源由 PR 审核。 |
| `runs` | 单次或配对结果含 1–2 条 Run。快照包括已归档的关联 Run，纯人工证据快照可以为空。 |
| `assessment` | 运行结果为 `null`，五维快照为下表所述对象。 |

| 记录内字段 | 含义 |
|---|---|
| Run 的 `id`、`generation`、`created_at`、`arch`、`platform`、`status` | Bench 实例内的运行编号、重跑代次、创建时间（UTC）、架构、公开平台名和运行状态。旧快照缺失的状态或平台信息保留为 `null`。 |
| Run 的 `commit`、`patch_sha256`、`recipe` | 可核实的基线提交、补丁摘要和配方名。没有记录时为 `null`。 |
| Run 的 `functional` | 功能用例计数，键为 `pass`、`fail`、`skip` 或 `other`。空对象表示没有功能用例记录。 |
| Run 的 `measurements[]` | 每条记录含 `case`、`metric`、`unit`、`variant`、`mean` 和 `samples`。按用例、指标、单位和 baseline/candidate 分组，对有数值的样本做算术平均。`samples` 是参与平均的数据行数，`unit: null` 表示单位未知。 |
| 评估的 `id`、`revision`、`version`、`target`、`reference`、`rule_version` | 评估编号、冻结修订、被测软件版本、目标及可选参考平台、使用的评分规则版本。 |
| 评估的 `confirmed`、`level` | Bench 的确认标记及该修订的整体等级（L0–L4 或 `null`）。已确认的 L0 表示有对应的未移植判定。 |
| 评估的 `dimensions` | `community` 社区、`functional` 功能、`performance` 性能、`stability` 稳定性、`architecture` 架构。每维保留 Bench 的 `status`、`score` 和 `provisional_score`。得分为 0–1 或 `null`。状态涵盖已评分、未知、初评、豁免、豁免待确认和豁免未通过。 |
| 评估的 `timings[]` | 快照中具有两侧可比均值的负载。保留用例名称、RV 和 ARM 秒数（十进制字符串）及各侧有效重复次数；初评数据随维度状态一起展示。 |
| 评估的 `evidence_sha256[]` | 冻结快照中已就绪证据的摘要，用于回到 Bench 核对原始证据。 |

### 合并后如何展示

PR 会校验 Schema、日期、内容摘要、运行配对和重复记录。合并到 `main` 后，GitHub Actions 从全部有效文件生成静态索引和详情数据，发布到 GitHub Pages。仓库维护者首次上线时需在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

软件总数按 `software_id` 去重；有测试记录的软件、已确认评级的软件和已提交的结果文件分别统计。整体等级分布只纳入已确认的快照。同一软件默认展示评估日期最近的已确认快照，尚无确认评级时展示日期最近的记录。同日依次按评估 ID、修订号降序、内容 ID 升序打破平局。其他版本、平台、重跑和未确认快照都可在“选择记录”中查看。场景示例保持单独标识。

### 本地校验与预览

在仓库根目录运行以下命令。构建目标使用新目录或空目录，以免保留已经撤下的结果。

```sh
python -m pip install jsonschema==4.26.0
python scripts/build.py
python scripts/build.py --output _site
python -m http.server 8000 --directory _site
```

打开 `http://localhost:8000/`。也可用 `--results <目录>` 对一组待提交文件做独立验证。首页只载入索引，进入软件详情后按需读取所选结果。
