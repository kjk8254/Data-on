"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type View = "home" | "classify" | "transform" | "communicate";
type DataKind = "analog" | "digital";

type ClassifyItem = {
  id: string;
  title: string;
  detail: string;
  icon: string;
  answer: DataKind;
};

const navItems: { id: Exclude<View, "home">; label: string; compact: string; mark: string }[] = [
  { id: "classify", label: "데이터 분류하기", compact: "분류", mark: "▦" },
  { id: "transform", label: "데이터 변환하기", compact: "변환", mark: "01" },
  { id: "communicate", label: "데이터로 소통하기", compact: "소통", mark: "↔" },
];

const classifyItems: ClassifyItem[] = [
  { id: "paper", title: "종이에 그린 그림", detail: "연필의 선과 색이 연속적으로 표현돼요", icon: "🎨", answer: "analog" },
  { id: "clock", title: "바늘 시계", detail: "바늘이 움직이며 시간을 나타내요", icon: "🕰️", answer: "analog" },
  { id: "tape", title: "카세트테이프", detail: "소리의 파형을 연속적인 자성으로 담아요", icon: "📼", answer: "analog" },
  { id: "thermometer", title: "수은 온도계", detail: "액체의 높이가 온도에 따라 변해요", icon: "🌡️", answer: "analog" },
  { id: "photo", title: "스마트폰 사진", detail: "수많은 픽셀의 숫자 정보로 저장돼요", icon: "📱", answer: "digital" },
  { id: "message", title: "문자 메시지", detail: "문자가 코드로 바뀌어 전송돼요", icon: "💬", answer: "digital" },
  { id: "mp3", title: "MP3 음악", detail: "소리를 숫자로 바꾸어 저장해요", icon: "🎧", answer: "digital" },
  { id: "digital-clock", title: "디지털 시계", detail: "시간을 정해진 숫자로 표시해요", icon: "⌚", answer: "digital" },
];

const colorRule = [
  { name: "빨강", color: "#ef476f", bits: "00" },
  { name: "파랑", color: "#3977e8", bits: "01" },
  { name: "노랑", color: "#f2bd34", bits: "10" },
  { name: "초록", color: "#2fc48d", bits: "11" },
];

const treasureItems = [
  { id: "tree", icon: "🌳", label: "나무", code: "01110010" },
  { id: "castle", icon: "🏰", label: "성", code: "010100111001" },
  { id: "wave", icon: "🌊", label: "파도", code: "11100101" },
  { id: "door", icon: "🚪", label: "문", code: "10001110" },
  { id: "star", icon: "⭐", label: "별", code: "01001100" },
  { id: "flower", icon: "🌸", label: "꽃", code: "10100111" },
  { id: "diamond", icon: "💎", label: "보석", code: "0111011111011100010000000" },
];

const pixelTarget = [
  0, 1, 1, 1, 0,
  1, 1, 1, 1, 1,
  0, 1, 1, 1, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 0, 0,
];

function normalizeBinary(value: string, limit: number) {
  return value.replace(/[^01]/g, "").slice(0, limit);
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [message, setMessage] = useState("");

  const [assignments, setAssignments] = useState<Record<string, DataKind>>({});
  const [selectedClassItem, setSelectedClassItem] = useState<string | null>(null);
  const [classificationChecked, setClassificationChecked] = useState(false);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [gridSize, setGridSize] = useState(16);
  const [pixelColors, setPixelColors] = useState<string[]>([]);
  const [isPixelating, setIsPixelating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commStage, setCommStage] = useState(1);
  const [unlockedStage, setUnlockedStage] = useState(1);
  const [colorAnswer, setColorAnswer] = useState("");
  const [numberAnswer, setNumberAnswer] = useState("");
  const [pixelCells, setPixelCells] = useState<number[]>(Array(25).fill(0));
  const [treasureSequence, setTreasureSequence] = useState<string[]>([]);
  const [stageSuccess, setStageSuccess] = useState<number[]>([]);

  const classificationScore = useMemo(
    () => classifyItems.filter((item) => assignments[item.id] === item.answer).length,
    [assignments],
  );

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
  }

  function moveTo(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function assignItem(itemId: string, kind: DataKind) {
    setAssignments((current) => ({ ...current, [itemId]: kind }));
    setSelectedClassItem(null);
    setClassificationChecked(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, kind: DataKind) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain");
    if (itemId) assignItem(itemId, kind);
  }

  function checkClassification() {
    if (Object.keys(assignments).length !== classifyItems.length) {
      notify("모든 데이터 카드를 두 상자에 분류해 주세요.");
      return;
    }
    setClassificationChecked(true);
    notify(classificationScore === classifyItems.length ? "모든 데이터를 정확하게 분류했어요!" : "표시된 카드를 다시 생각해 보세요.");
  }

  async function pixelateImage(dataUrl: string, size: number) {
    setIsPixelating(true);
    try {
      const image = new Image();
      image.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("이미지를 변환할 수 없어요.");

      const sourceRatio = image.width / image.height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.width;
      let sourceHeight = image.height;
      if (sourceRatio > 1) {
        sourceWidth = image.height;
        sourceX = (image.width - sourceWidth) / 2;
      } else {
        sourceHeight = image.width;
        sourceY = (image.height - sourceHeight) / 2;
      }
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);
      const data = context.getImageData(0, 0, size, size).data;
      const colors: string[] = [];
      for (let index = 0; index < data.length; index += 4) {
        const quantize = (value: number) => Math.min(255, Math.round(value / 32) * 32);
        colors.push(`rgb(${quantize(data[index])}, ${quantize(data[index + 1])}, ${quantize(data[index + 2])})`);
      }
      setPixelColors(colors);
    } catch (error) {
      notify(error instanceof Error ? error.message : "사진 변환에 실패했어요.");
    } finally {
      setIsPixelating(false);
    }
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("사진 파일을 선택해 주세요.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      notify("12MB 이하의 사진을 선택해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setSourceImage(dataUrl);
      setSourceName(file.name);
      void pixelateImage(dataUrl, gridSize);
    };
    reader.onerror = () => notify("사진을 읽지 못했어요.");
    reader.readAsDataURL(file);
  }

  function changeGridSize(size: number) {
    setGridSize(size);
    if (sourceImage) void pixelateImage(sourceImage, size);
  }

  function completeStage(stage: number, text: string) {
    setStageSuccess((current) => current.includes(stage) ? current : [...current, stage]);
    const next = Math.min(4, stage + 1);
    setUnlockedStage((current) => Math.max(current, next));
    notify(text);
    if (stage < 4) window.setTimeout(() => setCommStage(next), 650);
  }

  function checkColorCode() {
    if (colorAnswer === "01110010") completeStage(1, "색깔 메시지를 정확히 해독했어요!");
    else notify("색의 순서와 변환 규칙을 다시 확인해 보세요.");
  }

  function checkNumberCode() {
    if (numberAnswer === "010100111001") completeStage(2, "숫자를 4비트씩 정확히 바꿨어요!");
    else notify("5, 3, 9를 각각 네 자리 이진수로 바꿔 이어 보세요.");
  }

  function checkPixelCode() {
    if (pixelCells.every((value, index) => value === pixelTarget[index])) completeStage(3, "픽셀 성을 완성하고 보석 데이터를 얻었어요!");
    else notify("왼쪽의 이진수에서 1인 칸만 채워 보세요.");
  }

  function addTreasure(id: string) {
    if (treasureSequence.length >= 3) return;
    setTreasureSequence((current) => [...current, id]);
  }

  function openTreasureDoor() {
    if (treasureSequence.join(",") === "tree,castle,diamond") completeStage(4, "보물 문이 열렸어요! 데이터로 소통하기 성공!");
    else notify("기록장의 DATA 1, DATA 2와 보석 아이템을 차례로 골라 보세요.");
  }

  const renderHome = () => (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot" /> 직접 해보는 데이터 수업</span>
          <h1>데이터를 보고,<br /><span>바꾸고, 함께 읽어요.</span></h1>
          <p>아날로그와 디지털 데이터를 구분하고, 내가 그린 그림을 픽셀로 바꾸고, 0과 1로 친구와 메시지를 나눠보세요.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => moveTo("classify")}>첫 활동 시작하기 <span>→</span></button>
            <button className="secondary-button" onClick={() => moveTo("transform")}>사진을 픽셀로 바꾸기</button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack"><span>분</span><span>변</span><span>소</span><span>✓</span></div>
            <p><strong>세 가지 활동으로</strong> 데이터의 흐름을 한 번에 이해해요.</p>
          </div>
        </div>
        <div className="hero-visual" aria-label="데이터가 변환되고 전달되는 모습">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="float-card card-text"><span className="card-emoji">🎨</span><div><b>종이 그림</b><small>아날로그 데이터</small></div><span className="mini-check">1</span></div>
          <div className="float-card card-number"><span className="card-emoji">▦</span><div><b>16 × 16 픽셀</b><small>디지털 데이터</small></div><span className="mini-check">2</span></div>
          <div className="float-card card-image"><span className="card-emoji">💬</span><div><b>0101 0011</b><small>데이터 메시지</small></div><span className="mini-check">3</span></div>
          <div className="binary-bubble"><strong>0101</strong><span>같은 규칙으로 소통</span></div>
          <div className="center-node"><span>data</span><strong>ON</strong></div>
        </div>
      </section>

      <section className="journey-section shell">
        <div className="section-heading">
          <span className="eyebrow">오늘의 데이터 여정</span>
          <h2>보고, 바꾸고, 전해보세요</h2>
          <p>서로 이어지는 세 가지 활동으로 데이터의 의미를 발견해요.</p>
        </div>
        <div className="journey-grid three">
          {[
            { step: "01", title: "데이터 분류하기", desc: "아날로그와 디지털 데이터의 특징을 알고 직접 나눠요.", mark: "▦", tone: "blue", go: "classify" as View },
            { step: "02", title: "데이터 변환하기", desc: "종이 그림을 촬영해 업로드하고 모눈 픽셀로 바꿔요.", mark: "01", tone: "violet", go: "transform" as View },
            { step: "03", title: "데이터로 소통하기", desc: "같은 변환 규칙을 이용해 0과 1의 보물 암호를 풀어요.", mark: "↔", tone: "mint", go: "communicate" as View },
          ].map((card) => (
            <button key={card.step} className={`journey-card ${card.tone}`} onClick={() => moveTo(card.go)}>
              <span className="step">STEP {card.step}</span>
              <span className="journey-icon">{card.mark}</span>
              <strong>{card.title}</strong>
              <p>{card.desc}</p>
              <span className="card-link">시작하기 <b>→</b></span>
            </button>
          ))}
        </div>
      </section>

      <section className="class-banner shell communication-banner">
        <div><span className="eyebrow white">마지막 미션</span><h2>0과 1로 보낸 메시지,<br />친구와 함께 해독해 볼까요?</h2></div>
        <button onClick={() => moveTo("communicate")}>보물 암호 풀기 <span>→</span></button>
        <div className="banner-dots" aria-hidden="true">0111&nbsp; 0010&nbsp; 1001</div>
      </section>
    </main>
  );

  const renderClassify = () => {
    const unassigned = classifyItems.filter((item) => !assignments[item.id]);
    return (
      <main className="page-main shell lesson-main">
        <div className="page-intro centered compact-intro">
          <span className="eyebrow">활동 1 · 데이터 분류하기</span>
          <h1>아날로그일까요, 디지털일까요?</h1>
          <p>데이터가 표현되고 저장되는 모습을 살펴보며 두 종류를 구분해 보세요.</p>
        </div>

        <section className="lesson-guide">
          <div className="guide-heading"><span>1</span><div><small>활동 안내</small><h2>먼저 두 데이터의 특징을 알아봐요</h2></div></div>
          <div className="definition-grid">
            <article className="definition-card analog"><span className="definition-icon">〰</span><div><span className="definition-label">아날로그 데이터란?</span><h3>연속적으로 변하는 모습을 그대로 나타낸 데이터</h3><p>소리의 파형, 시계 바늘, 온도계 눈금처럼 값이 끊어지지 않고 자연스럽게 이어져요.</p><div className="definition-examples"><span>바늘 시계</span><span>종이 그림</span><span>카세트테이프</span></div></div></article>
            <article className="definition-card digital"><span className="definition-icon">01</span><div><span className="definition-label">디지털 데이터란?</span><h3>정보를 일정한 숫자나 기호로 바꾼 데이터</h3><p>컴퓨터가 저장하고 처리할 수 있도록 사진, 소리, 글자를 0과 1의 조합으로 표현해요.</p><div className="definition-examples"><span>스마트폰 사진</span><span>MP3</span><span>문자 메시지</span></div></div></article>
          </div>
        </section>

        <section className="classify-activity">
          <div className="activity-title-row"><div><span>2</span><div><small>분류 미션</small><h2>아날로그 데이터와 디지털 데이터를 분류해 주세요</h2></div></div><strong>{Object.keys(assignments).length}/{classifyItems.length}</strong></div>
          <div className="mission-note"><span>💡</span><div><strong>카드를 누른 뒤 상자를 누르거나, 카드째 끌어다 놓으세요.</strong><p>저장 방식과 표현 방식이 어떤지 생각하면 쉽게 구분할 수 있어요.</p></div></div>
          <div className="classification-pool">
            <div className="pool-header"><h3>분류할 데이터</h3><span>{unassigned.length}개 남음</span></div>
            <div className="data-card-row classification-row">
              {unassigned.length ? unassigned.map((item) => (
                <button key={item.id} className={`data-card ${selectedClassItem === item.id ? "selected" : ""}`} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => setSelectedClassItem(selectedClassItem === item.id ? null : item.id)}>
                  <span className="data-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><i>⋮⋮</i>
                </button>
              )) : <div className="pool-complete"><span>✓</span> 모든 카드를 분류했어요.</div>}
            </div>
          </div>
          <div className="kind-grid">
            {(["analog", "digital"] as DataKind[]).map((kind) => {
              const placed = classifyItems.filter((item) => assignments[item.id] === kind);
              const label = kind === "analog" ? "아날로그 데이터" : "디지털 데이터";
              return (
                <div key={kind} className={`kind-box ${kind} ${selectedClassItem ? "ready" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, kind)} onClick={() => selectedClassItem && assignItem(selectedClassItem, kind)} role="button" tabIndex={0} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && selectedClassItem) assignItem(selectedClassItem, kind); }}>
                  <div className="kind-heading"><span>{kind === "analog" ? "〰" : "01"}</span><div><h3>{label}</h3><p>{kind === "analog" ? "연속적으로 이어지는 정보" : "정해진 값으로 바꾼 정보"}</p></div><b>{placed.length}</b></div>
                  <div className="kind-items">
                    {placed.map((item) => <div key={item.id} className={`kind-item ${classificationChecked ? (item.answer === kind ? "correct" : "wrong") : ""}`}><span>{item.icon}</span><div><strong>{item.title}</strong>{classificationChecked && item.answer !== kind && <small>다른 상자가 더 알맞아요</small>}</div><button aria-label={`${item.title} 분류 취소`} onClick={(event) => { event.stopPropagation(); setAssignments((current) => { const next = { ...current }; delete next[item.id]; return next; }); setClassificationChecked(false); }}>×</button></div>)}
                    {!placed.length && <div className="drop-hint">여기에 카드를 놓으세요</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="finish-row"><button className="primary-button" onClick={checkClassification}>분류 확인하기 <span>→</span></button>{classificationChecked && <p className={`result-message ${classificationScore === classifyItems.length ? "success" : "retry"}`}>{classificationScore === classifyItems.length ? "🎉 8개 모두 정확해요!" : `${classificationScore}개를 정확히 분류했어요. 표시된 카드를 다시 살펴보세요.`}</p>}</div>
        </section>
      </main>
    );
  };

  const renderTransform = () => (
    <main className="page-main shell lesson-main">
      <div className="page-intro centered compact-intro">
        <span className="eyebrow">활동 2 · 데이터 변환하기</span>
        <h1>종이 그림을 픽셀 데이터로 바꿔봐요</h1>
        <p>내가 만든 아날로그 그림이 모눈 칸에 맞춰 디지털 이미지로 변하는 과정을 확인하세요.</p>
      </div>

      <section className="instruction-strip">
        <div><span>1</span><strong>종이에 그림을 그려주세요.</strong><p>굵고 선명하게 그리면 픽셀 모양이 더 잘 보여요.</p></div>
        <i>→</i>
        <div><span>2</span><strong>사진을 찍어서 업로드해 주세요.</strong><p>정면에서 밝게 촬영한 사진이 좋아요.</p></div>
        <i>→</i>
        <div><span>3</span><strong>모눈 픽셀로 변환해요.</strong><p>사진의 색이 모눈 한 칸씩 숫자 데이터가 돼요.</p></div>
      </section>

      <section className="pixel-studio">
        <div className="upload-panel">
          <div className="guide-heading"><span>1</span><div><small>사진 준비</small><h2>그림 사진을 업로드해 주세요</h2></div></div>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={handleImageUpload} />
          {!sourceImage ? (
            <button className="upload-dropzone" onClick={() => fileInputRef.current?.click()}><span className="upload-icon">↑</span><strong>사진 선택 또는 촬영하기</strong><p>JPG, PNG, WEBP · 최대 12MB</p><i>사진 업로드</i></button>
          ) : (
            <div className="source-preview"><img src={sourceImage} alt="업로드한 그림" /><div><strong>{sourceName}</strong><p>사진은 이 기기 안에서만 변환돼요.</p><button className="secondary-button" onClick={() => fileInputRef.current?.click()}>다른 사진 선택</button></div></div>
          )}
          <div className="privacy-note"><span>✓</span><p><strong>안심하고 사용하세요</strong>업로드한 사진은 서버에 저장되지 않아요.</p></div>
        </div>

        <div className="pixel-panel">
          <div className="pixel-panel-head"><div className="guide-heading"><span>2</span><div><small>모눈 변환</small><h2>사진을 픽셀아트로 살펴봐요</h2></div></div><div className="grid-size-control" aria-label="모눈 크기 선택">{[8, 16, 24].map((size) => <button key={size} className={gridSize === size ? "active" : ""} onClick={() => changeGridSize(size)}>{size}×{size}</button>)}</div></div>
          <div className="pixel-canvas-wrap">
            {pixelColors.length ? <div className={`uploaded-pixel-grid ${isPixelating ? "loading" : ""}`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }} aria-label={`${gridSize} 곱하기 ${gridSize} 픽셀아트`}>{pixelColors.map((color, index) => <span key={index} style={{ backgroundColor: color }} />)}</div> : <div className="empty-pixel-grid"><div className="sample-grid">{Array.from({ length: 64 }, (_, index) => <span key={index} className={(index + Math.floor(index / 8)) % 3 === 0 ? "on" : ""} />)}</div><strong>사진을 올리면 이곳에 나타나요</strong><p>사진의 색을 평균 내어 모눈 한 칸에 맞춰 보여줘요.</p></div>}
          </div>
          {pixelColors.length > 0 && <div className="pixel-summary"><div><span>모눈 크기</span><strong>{gridSize} × {gridSize}</strong></div><div><span>전체 픽셀</span><strong>{gridSize * gridSize}개</strong></div><div><span>변환 상태</span><strong>{isPixelating ? "변환 중" : "완료"}</strong></div></div>}
        </div>
      </section>

      <div className="concept-strip"><span>💡</span><div><strong>사진은 어떻게 디지털 데이터가 될까요?</strong><p>컴퓨터는 사진을 작은 모눈인 픽셀로 나누고, 각 픽셀의 색을 숫자로 저장해요. 모눈이 촘촘할수록 더 자세한 그림을 표현할 수 있어요.</p></div></div>
    </main>
  );

  const renderStageOne = () => (
    <div className="comm-stage-card red-stage">
      <div className="stage-title"><span className="stage-icon">🔴</span><div><small>미션 1</small><h2>색깔 데이터 메시지</h2><p>색을 0과 1로 바꾸는 같은 규칙을 사용해 메시지를 읽어요.</p></div></div>
      <div className="teacher-callout"><span>🧑‍🏫</span><p>“컴퓨터는 색깔을 그대로 이해하지 못해요. 색마다 정해진 2진수 코드를 사용해 볼까요?”</p></div>
      <div className="color-rule-card"><span>변환 규칙</span><div>{colorRule.map((item) => <div key={item.bits}><i style={{ background: item.color }} /><small>{item.name}</small><strong>{item.bits}</strong></div>)}</div></div>
      <h3 className="challenge-prompt">다음 색깔을 차례대로 이진수로 입력하세요</h3>
      <div className="color-sequence">{[colorRule[1], colorRule[3], colorRule[0], colorRule[2]].map((item, index) => <span key={`${item.name}-${index}`}><i style={{ background: item.color }} />{index < 3 && <b>→</b>}</span>)}</div>
      <div className="answer-row"><input value={colorAnswer} onChange={(event) => setColorAnswer(normalizeBinary(event.target.value, 8))} inputMode="numeric" placeholder="00000000" aria-label="색깔 이진수 정답" /><button className="primary-button" onClick={checkColorCode}>입력 확인</button></div>
    </div>
  );

  const renderStageTwo = () => (
    <div className="comm-stage-card green-stage">
      <div className="stage-title"><span className="stage-icon">🌳</span><div><small>미션 2</small><h2>숫자의 숲</h2><p>각 숫자를 네 자리 이진수로 바꾸어 숲의 길을 찾아요.</p></div></div>
      <div className="number-hint">{Array.from({ length: 10 }, (_, index) => index + 1).map((number) => <span key={number}><b>{number}</b><code>{number.toString(2).padStart(4, "0")}</code></span>)}</div>
      <div className="number-challenge"><p>숫자 <strong>5, 3, 9</strong>를 이진수로 이어 입력하세요.</p><div className="number-cards"><span>5<small>0101</small></span><i>＋</i><span>3<small>0011</small></span><i>＋</i><span>9<small>1001</small></span></div></div>
      <div className="answer-row"><input value={numberAnswer} onChange={(event) => setNumberAnswer(normalizeBinary(event.target.value, 12))} inputMode="numeric" placeholder="000000000000" aria-label="숫자 이진수 정답" /><button className="primary-button" onClick={checkNumberCode}>입력 확인</button></div>
    </div>
  );

  const renderStageThree = () => (
    <div className="comm-stage-card violet-stage">
      <div className="stage-title"><span className="stage-icon">🏰</span><div><small>미션 3</small><h2>픽셀 성</h2><p>줄마다 적힌 0과 1을 보고 1인 칸을 눌러 그림을 완성해요.</p></div></div>
      <div className="pixel-code-note"><span className="zero-box" /> = 0, <span className="one-box" /> = 1</div>
      <div className="castle-builder">
        <div className="row-codes">{["01110", "11111", "01110", "00100", "00000"].map((row) => <code key={row}>{row}</code>)}</div>
        <div className="castle-grid">{pixelCells.map((cell, index) => <button key={index} className={cell ? "filled" : ""} aria-label={`${Math.floor(index / 5) + 1}행 ${index % 5 + 1}열 ${cell}`} onClick={() => setPixelCells((current) => current.map((value, cellIndex) => cellIndex === index ? (value ? 0 : 1) : value))} />)}</div>
      </div>
      {stageSuccess.includes(3) && <div className="diamond-found"><span>💎</span><strong>보석 아이템 획득!</strong></div>}
      <button className="primary-button stage-submit" onClick={checkPixelCode}>픽셀 그림 확인</button>
    </div>
  );

  const renderStageFour = () => (
    <div className="comm-stage-card yellow-stage">
      <div className="stage-title"><span className="stage-icon">💎</span><div><small>미션 4</small><h2>보물 동굴의 문</h2><p>저장한 이진수 기록을 해독해 알맞은 아이템 순서로 문을 열어요.</p></div></div>
      <div className="data-log"><span>[ 내 데이터 기록장 ]</span><code>DATA 1 : <b>01110010</b></code><code>DATA 2 : <b>010100111001</b></code><code>ITEM&nbsp;&nbsp; : <b>💎</b></code></div>
      <div className="treasure-dictionary">{treasureItems.slice(0, 6).map((item) => <span key={item.id}><b>{item.icon}</b><code>{item.code}</code></span>)}</div>
      <div className="treasure-lock">
        <span className="lock-label">🔓 암호 입력</span>
        <div className="selected-treasure">{[0, 1, 2].map((index) => <span key={index}>{treasureSequence[index] ? treasureItems.find((item) => item.id === treasureSequence[index])?.icon : "?"}{index < 2 && <i>→</i>}</span>)}</div>
        <div className="treasure-choices">{treasureItems.map((item) => <button key={item.id} className={treasureSequence.includes(item.id) ? "selected" : ""} onClick={() => addTreasure(item.id)}><span>{item.icon}</span>{item.label}</button>)}<button className="clear-choice" onClick={() => setTreasureSequence([])}>지우기</button></div>
        <button className="open-door-button" onClick={openTreasureDoor}>🔓 문 열기</button>
      </div>
      {stageSuccess.includes(4) && <div className="final-success"><span>🎉</span><h3>데이터 보물섬 탐험 완료!</h3><p>같은 변환 규칙을 사용하면 0과 1만으로도 정확하게 소통할 수 있어요.</p></div>}
    </div>
  );

  const renderCommunicate = () => (
    <main className="page-main shell communication-main">
      <div className="page-intro centered compact-intro">
        <span className="eyebrow">활동 3 · 데이터로 소통하기</span>
        <h1>0과 1의 보물 메시지를 해독해요</h1>
        <p>보내는 사람과 받는 사람이 같은 변환 규칙을 사용하면 디지털 데이터로 생각을 정확히 나눌 수 있어요.</p>
      </div>

      <div className="comm-progress" aria-label="보물 암호 활동 단계">
        {[{ icon: "🔴", label: "색깔 마을" }, { icon: "🌳", label: "숫자의 숲" }, { icon: "🏰", label: "픽셀 성" }, { icon: "💎", label: "보물 동굴" }].map((stage, index) => {
          const number = index + 1;
          return <button key={stage.label} disabled={number > unlockedStage} className={`${commStage === number ? "active" : ""} ${stageSuccess.includes(number) ? "done" : ""}`} onClick={() => setCommStage(number)}><span>{stageSuccess.includes(number) ? "✓" : stage.icon}</span><small>미션 {number}</small><strong>{stage.label}</strong></button>;
        })}
      </div>

      <div className="communication-definition"><span>↔</span><div><strong>데이터로 소통한다는 것은?</strong><p>정보를 숫자나 기호로 바꾸는 규칙을 함께 정하고, 그 규칙에 따라 데이터를 보내고 다시 뜻으로 되돌리는 과정이에요.</p></div></div>

      {commStage === 1 ? renderStageOne() : commStage === 2 ? renderStageTwo() : commStage === 3 ? renderStageThree() : renderStageFour()}
    </main>
  );

  return (
    <div className="site-wrap">
      <header className="topbar">
        <div className="topbar-inner shell">
          <button className="brand" onClick={() => moveTo("home")} aria-label="데이터온 홈"><span className="brand-mark"><i /><i /><i /></span><strong>데이터<span>온</span></strong></button>
          <nav className="desktop-nav three-nav" aria-label="주요 메뉴">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => moveTo(item.id)}>{item.label}</button>)}</nav>
        </div>
      </header>

      {view === "home" ? renderHome() : view === "classify" ? renderClassify() : view === "transform" ? renderTransform() : renderCommunicate()}

      <nav className="mobile-nav four-items" aria-label="모바일 주요 메뉴">
        <button className={view === "home" ? "active" : ""} onClick={() => moveTo("home")}><span>⌂</span>홈</button>
        {navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => moveTo(item.id)}><span>{item.mark}</span>{item.compact}</button>)}
      </nav>

      {message && <div className="toast" role="status"><span>✓</span>{message}</div>}
      <footer><div className="shell"><div className="brand muted"><span className="brand-mark"><i /><i /><i /></span><strong>데이터<span>온</span></strong></div><p>데이터를 이해하는 힘, 직접 해보는 즐거움.</p><span>교육용 데이터 리터러시 플랫폼</span></div></footer>
    </div>
  );
}
