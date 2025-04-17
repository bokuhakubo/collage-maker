const { ipcRenderer } = require('electron');

// DOM要素
const uploadBtn = document.getElementById('upload-btn');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const selectedImagesContainer = document.getElementById('selected-images');
const collagePreview = document.getElementById('collage-preview');
const positionControls = document.getElementById('position-controls');
const bgColorPicker = document.getElementById('bg-color');
const colorButtons = document.querySelectorAll('.color-btn');
const ratioButtons = document.querySelectorAll('.ratio-btn');
const customSizeContainer = document.getElementById('custom-size');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const layoutGroups = document.querySelectorAll('.layout-group');
const layoutItems = document.querySelectorAll('.layout-item');

// Canvas settings controls
const canvasPaddingSlider = document.getElementById('canvas-padding');
const canvasPaddingValue = document.getElementById('canvas-padding-value');
const photoSpacingSlider = document.getElementById('photo-spacing');
const photoSpacingValue = document.getElementById('photo-spacing-value');
const roundCornersSlider = document.getElementById('round-corners');
const roundCornersValue = document.getElementById('round-corners-value');

// 選択された画像を保存する配列
let selectedImages = [];
const MAX_IMAGES = 3;

// コラージュの設定
let collageSettings = {
  ratio: '1:1',
  width: 1080,
  height: 1080,
  bgColor: '#ffffff',
  canvasPadding: 10,
  photoSpacing: 10,
  roundCorners: 0,
  layout: 'single_center' // デフォルトレイアウト
};

// 初期化
function init() {
  // Custom sizeの表示・非表示
  updateCustomSizeVisibility();
  
  // レイアウトグループの初期表示
  updateLayoutGroups();
  
  // デフォルトの背景色ボタンをアクティブに
  const defaultColorBtn = document.querySelector('.color-btn[data-color="#FFFFFF"]');
  if (defaultColorBtn) {
    defaultColorBtn.classList.add('active');
  }
  
  // ラジオボタンの代わりにボタン選択のイベントリスナー
  ratioButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 以前の選択をクリア
      ratioButtons.forEach(btn => btn.classList.remove('active'));
      
      // クリックされたボタンをアクティブに
      button.classList.add('active');
      
      // 比率設定を更新
      const ratio = button.getAttribute('data-ratio');
      collageSettings.ratio = ratio;
      
      // キャンバスサイズを更新
      updateCanvasDimensions(ratio);
      
      // カスタムサイズの表示/非表示
      updateCustomSizeVisibility();
      
      // コラージュを更新
      if (selectedImages.length > 0) {
        createCollage();
      }
    });
  });
  
  // レイアウト選択のイベントリスナー
  layoutItems.forEach(item => {
    item.addEventListener('click', () => {
      // 以前の選択をクリア
      layoutItems.forEach(i => i.classList.remove('active'));
      
      // 新しい選択をアクティブに
      item.classList.add('active');
      
      // レイアウト設定を更新
      const layoutType = item.getAttribute('data-layout');
      collageSettings.layout = layoutType;
      
      // コラージュを更新
      if (selectedImages.length > 0) {
        createCollage();
      }
    });
  });
  
  // Canvas Paddingスライダーの更新
  canvasPaddingSlider.addEventListener('input', () => {
    const value = canvasPaddingSlider.value;
    canvasPaddingValue.value = value;
    collageSettings.canvasPadding = parseInt(value);
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  canvasPaddingValue.addEventListener('input', () => {
    const value = Math.min(Math.max(parseInt(canvasPaddingValue.value) || 0, 0), 50);
    canvasPaddingSlider.value = value;
    collageSettings.canvasPadding = value;
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  // Photo Spacingスライダーの更新
  photoSpacingSlider.addEventListener('input', () => {
    const value = photoSpacingSlider.value;
    photoSpacingValue.value = value;
    collageSettings.photoSpacing = parseInt(value);
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  photoSpacingValue.addEventListener('input', () => {
    const value = Math.min(Math.max(parseInt(photoSpacingValue.value) || 0, 0), 50);
    photoSpacingSlider.value = value;
    collageSettings.photoSpacing = value;
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  // Round Cornersスライダーの更新
  roundCornersSlider.addEventListener('input', () => {
    const value = roundCornersSlider.value;
    roundCornersValue.value = value;
    collageSettings.roundCorners = parseInt(value);
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  roundCornersValue.addEventListener('input', () => {
    const value = Math.min(Math.max(parseInt(roundCornersValue.value) || 0, 0), 50);
    roundCornersSlider.value = value;
    collageSettings.roundCorners = value;
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  // 色ボタンのイベントリスナー
  colorButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 以前の選択をクリア
      colorButtons.forEach(btn => btn.classList.remove('active'));
      
      // クリックされたボタンをアクティブに
      button.classList.add('active');
      
      const color = button.getAttribute('data-color');
      collageSettings.bgColor = color;
      
      // コラージュを更新
      if (selectedImages.length > 0) {
        createCollage();
      }
    });
  });
  
  // カスタムサイズの入力
  widthInput.addEventListener('input', () => {
    collageSettings.width = parseInt(widthInput.value) || 1080;
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  heightInput.addEventListener('input', () => {
    collageSettings.height = parseInt(heightInput.value) || 1080;
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
  
  // クリアボタン
  clearBtn.addEventListener('click', () => {
    // デフォルト設定に戻す
    ratioButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-ratio') === '1:1') {
        btn.classList.add('active');
      }
    });
    
    // デフォルトの背景色ボタンをアクティブに
    colorButtons.forEach(btn => btn.classList.remove('active'));
    const whiteColorBtn = document.querySelector('.color-btn[data-color="#FFFFFF"]');
    if (whiteColorBtn) {
      whiteColorBtn.classList.add('active');
    }
    
    // 画像の数に応じたレイアウトを設定
    let defaultLayout = 'single_center';
    if (selectedImages.length === 2) {
      defaultLayout = 'two_vertical';
    } else if (selectedImages.length === 3) {
      defaultLayout = 'three_vertical';
    }
    
    collageSettings = {
      ratio: '1:1',
      width: 1080,
      height: 1080,
      bgColor: '#ffffff',
      canvasPadding: 10,
      photoSpacing: 10,
      roundCorners: 0,
      layout: defaultLayout
    };
    
    // UIを更新
    canvasPaddingSlider.value = 10;
    canvasPaddingValue.value = 10;
    photoSpacingSlider.value = 10;
    photoSpacingValue.value = 10;
    roundCornersSlider.value = 0;
    roundCornersValue.value = 0;
    widthInput.value = 1080;
    heightInput.value = 1080;
    
    updateCustomSizeVisibility();
    updateLayoutGroups();
    
    // コラージュを更新
    if (selectedImages.length > 0) {
      createCollage();
    }
  });
}

// 画像数に応じてレイアウトグループを表示
function updateLayoutGroups() {
  const imageCount = selectedImages.length;
  
  // すべてのレイアウトグループを非表示
  layoutGroups.forEach(group => {
    group.classList.remove('active');
  });
  
  // 画像がない場合は何も表示しない
  if (imageCount === 0) return;
  
  // 画像数に対応するレイアウトグループを表示
  const targetGroup = document.querySelector(`.layout-group[data-image-count="${imageCount}"]`);
  if (targetGroup) {
    targetGroup.classList.add('active');
    
    // レイアウトに合わせたアイテムを選択状態に
    let activeItem = targetGroup.querySelector(`.layout-item[data-layout="${collageSettings.layout}"]`);
    
    // 選択中のレイアウトが現在の画像数に合わないなら、デフォルトを選択
    if (!activeItem) {
      let defaultLayout;
      switch (imageCount) {
        case 1:
          defaultLayout = 'single_center';
          break;
        case 2:
          defaultLayout = 'two_vertical';
          break;
        case 3:
          defaultLayout = 'three_vertical';
          break;
      }
      
      collageSettings.layout = defaultLayout;
      activeItem = targetGroup.querySelector(`.layout-item[data-layout="${defaultLayout}"]`);
    }
    
    // 以前の選択をクリア
    layoutItems.forEach(item => item.classList.remove('active'));
    
    // 新しいレイアウトをアクティブに
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
}

// 比率に基づいてキャンバスのサイズを更新
function updateCanvasDimensions(ratio) {
  switch (ratio) {
    case '1:1':
      collageSettings.width = 1080;
      collageSettings.height = 1080;
      break;
    case '4:3':
      collageSettings.width = 1200;
      collageSettings.height = 900;
      break;
    case '3:2':
      collageSettings.width = 1200;
      collageSettings.height = 800;
      break;
    case '16:9':
      collageSettings.width = 1600;
      collageSettings.height = 900;
      break;
    case 'single-image':
      collageSettings.width = 1600;
      collageSettings.height = 900;
      break;
    case 'card-image':
      collageSettings.width = 1200;
      collageSettings.height = 628;
      break;
    case 'instagram-square':
      collageSettings.width = 1080;
      collageSettings.height = 1080;
      break;
    case 'instagram-portrait':
      collageSettings.width = 1080;
      collageSettings.height = 1350;
      break;
    case 'instagram-landscape':
      collageSettings.width = 1080;
      collageSettings.height = 566;
      break;
    case 'instagram-stories':
    case 'instagram-reels':
      collageSettings.width = 1080;
      collageSettings.height = 1920;
      break;
    case 'custom':
      // カスタムサイズは入力欄から取得
      collageSettings.width = parseInt(widthInput.value) || 1080;
      collageSettings.height = parseInt(heightInput.value) || 1080;
      break;
  }
  
  // 入力欄の更新
  widthInput.value = collageSettings.width;
  heightInput.value = collageSettings.height;
}

// カスタムサイズ入力欄の表示・非表示
function updateCustomSizeVisibility() {
  const activeRatioBtn = document.querySelector('.ratio-btn.active');
  const isCustom = activeRatioBtn && activeRatioBtn.getAttribute('data-ratio') === 'custom';
  
  if (isCustom) {
    customSizeContainer.classList.add('active');
  } else {
    customSizeContainer.classList.remove('active');
  }
}

// 画像アップロードボタンのイベントリスナー
uploadBtn.addEventListener('click', async () => {
  const filePaths = await ipcRenderer.invoke('open-file-dialog');
  
  if (filePaths.length > 0) {
    // 最大3枚までの制限を適用
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    const imagesToAdd = filePaths.slice(0, remainingSlots);
    
    if (imagesToAdd.length > 0) {
      await loadImages(imagesToAdd);
      updateUI();
      
      // 画像がアップロードされたら自動的にコラージュを作成
      if (selectedImages.length > 0) {
        createCollage();
      }
    }
  }
});

// 保存ボタンのイベントリスナー
saveBtn.addEventListener('click', async () => {
  const canvas = collagePreview.querySelector('canvas');
  if (!canvas) return;
  
  try {
    // キャンバスからPNG形式でデータURLを取得
    const imageData = canvas.toDataURL('image/png');
    
    // メインプロセスに保存リクエストを送信（ダイアログあり）
    const result = await ipcRenderer.invoke('save-collage', imageData);
    
    if (result.success) {
      console.log(`Collage saved: ${result.filePath}`);
    } else if (!result.canceled) {
      // キャンセルされた場合は何もしない
      alert(`Error: ${result.error || result.message}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

// 画像をロードする関数
async function loadImages(filePaths) {
  for (const filePath of filePaths) {
    if (selectedImages.length >= MAX_IMAGES) break;
    
    const result = await ipcRenderer.invoke('read-image-file', filePath);
    
    if (result.success) {
      selectedImages.push({
        path: result.path,
        data: result.data
      });
    }
  }
}

// UIを更新する関数
function updateUI() {
  // プレースホルダーメッセージを削除
  const placeholderMsg = selectedImagesContainer.querySelector('.placeholder-message');
  if (placeholderMsg && selectedImages.length > 0) {
    placeholderMsg.remove();
  }
  
  // 選択された画像を表示
  selectedImagesContainer.innerHTML = '';
  
  if (selectedImages.length === 0) {
    selectedImagesContainer.innerHTML = `
      <div class="placeholder-message">
        Upload images (maximum 3)
      </div>
    `;
    
    // レイアウトグループを非表示
    layoutGroups.forEach(group => group.classList.remove('active'));
  } else {
    selectedImages.forEach((image, index) => {
      const imageElement = document.createElement('div');
      imageElement.className = 'image-item';
      imageElement.innerHTML = `
        <img src="data:image/jpeg;base64,${image.data}" alt="Selected image ${index + 1}">
        <button class="remove-image" data-index="${index}">×</button>
      `;
      selectedImagesContainer.appendChild(imageElement);
    });
    
    // 削除ボタンにイベントリスナーを追加
    document.querySelectorAll('.remove-image').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        selectedImages.splice(index, 1);
        updateUI();
        
        // 画像が残っている場合はコラージュを更新
        if (selectedImages.length > 0) {
          updateLayoutGroups();
          createCollage();
        } else {
          // 画像がない場合はキャンバスをクリア
          const existingCanvas = collagePreview.querySelector('canvas');
          if (existingCanvas) {
            existingCanvas.remove();
          }
        }
      });
    });
    
    // レイアウトグループを更新
    updateLayoutGroups();
  }
}

// コラージュを作成する関数
function createCollage() {
  // キャンバスの作成
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // キャンバスサイズの設定
  const canvasWidth = collageSettings.width;
  const canvasHeight = collageSettings.height;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // 背景色を設定
  ctx.fillStyle = collageSettings.bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 選択された画像の数に応じてレイアウトを決定
  const imageCount = selectedImages.length;
  const padding = collageSettings.canvasPadding;
  const spacing = collageSettings.photoSpacing;
  const borderRadius = collageSettings.roundCorners;
  
  // レイアウトタイプに応じてコラージュを作成
  switch (collageSettings.layout) {
    case 'single_center':
      drawSingleImage(ctx, canvas, padding, borderRadius);
      break;
    case 'two_horizontal':
      drawTwoHorizontal(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'two_vertical':
      drawTwoVertical(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'three_horizontal':
      drawThreeHorizontal(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'three_vertical':
      drawThreeVertical(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'top1_bottom2':
      drawTop1Bottom2(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'top2_bottom1':
      drawTop2Bottom1(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'left1_right2':
      drawLeft1Right2(ctx, canvas, padding, spacing, borderRadius);
      break;
    case 'left2_right1':
      drawLeft2Right1(ctx, canvas, padding, spacing, borderRadius);
      break;
    default:
      // デフォルトは画像数に応じた適切なレイアウト
      if (imageCount === 1) {
        drawSingleImage(ctx, canvas, padding, borderRadius);
      } else if (imageCount === 2) {
        drawTwoVertical(ctx, canvas, padding, spacing, borderRadius);
      } else if (imageCount === 3) {
        drawThreeVertical(ctx, canvas, padding, spacing, borderRadius);
      }
  }
}

// object-fit:cover相当の画像描画
function drawCoverImage(ctx, img, x, y, width, height, radius) {
  // 画像のアスペクト比を計算
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = width / height;
  
  // 画像サイズを計算
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (imgRatio > boxRatio) {
    // 画像の方が横長の場合、高さに合わせる
    drawHeight = height;
    drawWidth = height * imgRatio;
    // 中央に配置
    offsetX = -(drawWidth - width) / 2;
    offsetY = 0;
  } else {
    // 画像の方が縦長の場合、幅に合わせる
    drawWidth = width;
    drawHeight = width / imgRatio;
    // 中央に配置
    offsetX = 0;
    offsetY = -(drawHeight - height) / 2;
  }
  
  ctx.save();
  
  // 角丸のパスを作成
  if (radius > 0) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }
  
  // 画像を描画
  ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
  
  ctx.restore();
}

// 1枚の画像を描画（中央配置）
function drawSingleImage(ctx, canvas, padding, borderRadius) {
  const img = new Image();
  img.onload = () => {
    const { width, height } = canvas;
    const drawWidth = width - (padding * 2);
    const drawHeight = height - (padding * 2);
    const x = padding;
    const y = padding;
    
    drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
    
    displayCollage(canvas);
  };
  img.src = `data:image/jpeg;base64,${selectedImages[0].data}`;
}

// 2枚の画像を横に並べて描画
function drawTwoHorizontal(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      // 横並び
      const drawWidth = (width - (padding * 2 + spacing)) / 2;
      const drawHeight = height - (padding * 2);
      const x = padding + index * (drawWidth + spacing);
      const y = padding;
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 2) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 2枚の画像を縦に並べて描画
function drawTwoVertical(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      // 縦並び
      const drawWidth = width - (padding * 2);
      const drawHeight = (height - (padding * 2 + spacing)) / 2;
      const x = padding;
      const y = padding + index * (drawHeight + spacing);
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 2) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 3枚の画像を横に並べて描画
function drawThreeHorizontal(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      // 横並び（3枚）
      const drawWidth = (width - (padding * 2 + spacing * 2)) / 3;
      const drawHeight = height - (padding * 2);
      const x = padding + index * (drawWidth + spacing);
      const y = padding;
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 3) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 3枚の画像を縦に並べて描画
function drawThreeVertical(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      // 縦並び（3枚）
      const drawWidth = width - (padding * 2);
      const drawHeight = (height - (padding * 2 + spacing * 2)) / 3;
      const x = padding;
      const y = padding + index * (drawHeight + spacing);
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 3) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 上に1枚、下に2枚のレイアウト
function drawTop1Bottom2(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      let x, y, drawWidth, drawHeight;
      
      if (index === 0) {
        // 上部の画像
        drawWidth = width - (padding * 2);
        drawHeight = (height - (padding * 2 + spacing)) / 2;
        x = padding;
        y = padding;
      } else {
        // 下部の画像
        drawWidth = (width - (padding * 2 + spacing)) / 2;
        drawHeight = (height - (padding * 2 + spacing)) / 2;
        x = padding + (index - 1) * (drawWidth + spacing);
        y = padding + drawHeight + spacing;
      }
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 3) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 上に2枚、下に1枚のレイアウト
function drawTop2Bottom1(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      let x, y, drawWidth, drawHeight;
      
      if (index < 2) {
        // 上部の画像
        drawWidth = (width - (padding * 2 + spacing)) / 2;
        drawHeight = (height - (padding * 2 + spacing)) / 2;
        x = padding + index * (drawWidth + spacing);
        y = padding;
      } else {
        // 下部の画像
        drawWidth = width - (padding * 2);
        drawHeight = (height - (padding * 2 + spacing)) / 2;
        x = padding;
        y = padding + drawHeight + spacing;
      }
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 3) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 左に1枚、右に2枚のレイアウト
function drawLeft1Right2(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      let x, y, drawWidth, drawHeight;
      
      if (index === 0) {
        // 左側の画像
        drawWidth = (width - (padding * 2 + spacing)) / 2;
        drawHeight = height - (padding * 2);
        x = padding;
        y = padding;
      } else {
        // 右側の画像
        drawWidth = (width - (padding * 2 + spacing)) / 2;
        drawHeight = (height - (padding * 2 + spacing)) / 2;
        x = padding + drawWidth + spacing;
        y = padding + (index - 1) * (drawHeight + spacing);
      }
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 3) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// 左に2枚、右に1枚のレイアウト
function drawLeft2Right1(ctx, canvas, padding, spacing, borderRadius) {
  const { width, height } = canvas;
  let loadedImages = 0;
  
  selectedImages.forEach((imageData, index) => {
    const img = new Image();
    img.onload = () => {
      let x, y, drawWidth, drawHeight;
      
      if (index < 2) {
        // 左側の画像
        drawWidth = (width - (padding * 2 + spacing)) / 2;
        drawHeight = (height - (padding * 2 + spacing)) / 2;
        x = padding;
        y = padding + index * (drawHeight + spacing);
      } else {
        // 右側の画像
        drawWidth = (width - (padding * 2 + spacing)) / 2;
        drawHeight = height - (padding * 2);
        x = padding + drawWidth + spacing;
        y = padding;
      }
      
      drawCoverImage(ctx, img, x, y, drawWidth, drawHeight, borderRadius);
      
      loadedImages++;
      if (loadedImages === 3) {
        displayCollage(canvas);
      }
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  });
}

// コラージュをプレビューに表示する関数
function displayCollage(canvas) {
  // 既存のキャンバスがあれば削除
  const existingCanvas = collagePreview.querySelector('canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  
  canvas.className = 'collage-canvas';
  collagePreview.appendChild(canvas);
}

// アプリケーションの初期化
init(); 