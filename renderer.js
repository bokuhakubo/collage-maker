document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const uploadedImages = document.getElementById('uploadedImages');
    const mainPreview = document.getElementById('mainPreview');
    const layoutOptions = document.getElementById('layoutOptions');
    const collageSection = document.getElementById('collageSection');
    const aspectRatioButtons = document.querySelectorAll('.aspect-ratio-btn');
    const socialMediaButtons = document.querySelectorAll('.social-media-btn');
    const paddingControl = document.getElementById('padding');
    const paddingNumberInput = document.getElementById('paddingNumber');
    const gapControl = document.getElementById('gap');
    const gapNumberInput = document.getElementById('gapNumber');
    const cornerRadiusControl = document.getElementById('cornerRadius');
    const cornerRadiusNumberInput = document.getElementById('cornerRadiusNumber');
    const bgColorControl = document.getElementById('bgColor');
    const colorPickerBtn = document.getElementById('colorPickerBtn');
    const colorPreview = colorPickerBtn.querySelector('.color-preview');
    const colorPresets = document.querySelectorAll('.color-preset');
    const resetButton = document.getElementById('resetCollage');
    const downloadButton = document.getElementById('downloadCollage');
    
    // モーダル関連の要素
    const modal = document.getElementById('sizeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalOptions = document.getElementById('modalOptions');
    const closeBtn = document.querySelector('.close-btn');

    const zoomSelect = document.getElementById('zoomSelect');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    let images = [];
    let currentLayout = null;
    let currentAspectRatio = '1:1';
    let customWidth = 0;
    let customHeight = 0;

    // 現在のズームレベルを追跡
    let currentZoom = 100; // パーセント
    let originalWidth = 0;
    let originalHeight = 0;

    // SNSサイズのデータ
    const snsSizes = {
        x: [
            { title: 'Single Image', width: 1600, height: 900, ratio: '16:9' },
            { title: 'Multiple Images', width: 1200, height: 675, ratio: '16:9' },
            { title: 'Card Image', width: 1200, height: 628, ratio: '1.91:1' },
            { title: 'Profile Image', width: 400, height: 400, ratio: '1:1' },
            { title: 'Header Image', width: 1500, height: 500, ratio: '3:1' }
        ],
        instagram: [
            { title: 'Square Post', width: 1080, height: 1080, ratio: '1:1' },
            { title: 'Portrait Post', width: 1080, height: 1350, ratio: '4:5' },
            { title: 'Landscape Post', width: 1080, height: 566, ratio: '1.91:1' },
            { title: 'Stories', width: 1080, height: 1920, ratio: '9:16' },
            { title: 'Reels', width: 1080, height: 1920, ratio: '9:16' },
            { title: 'IGTV Cover', width: 420, height: 654, ratio: '2:3' },
            { title: 'Profile Image', width: 320, height: 320, ratio: '1:1' }
        ],
        threads: [
            { title: 'Square Post', width: 1080, height: 1080, ratio: '1:1' },
            { title: 'Portrait Post', width: 1080, height: 1350, ratio: '4:5' },
            { title: 'Landscape Post', width: 1080, height: 608, ratio: '16:9' },
            { title: 'Profile Image', width: 320, height: 320, ratio: '1:1' }
        ]
    };

    // アスペクト比の設定
    aspectRatioButtons.forEach(button => {
        button.addEventListener('click', () => {
            aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentAspectRatio = button.dataset.ratio;
            customWidth = 0;
            customHeight = 0;
            
            // SNSボタンのアクティブ状態を解除
            socialMediaButtons.forEach(btn => btn.classList.remove('active'));
            
            // アスペクト比変更時はレイアウトオプションも再描画
            updateCollage();
            updateLayoutOptions();
        });
    });

    // SNSサイズボタンのイベント
    socialMediaButtons.forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.dataset.platform;
            showSizeOptions(platform);
        });
    });

    // モーダルを閉じる
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // モーダル外をクリックしても閉じる
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // SNSサイズオプションを表示
    function showSizeOptions(platform) {
        const sizes = snsSizes[platform];
        modalTitle.textContent = `Select ${platform === 'x' ? 'X (Twitter)' : platform} Image Size`;
        modalOptions.innerHTML = '';
        
        // SNSボタンのアクティブ状態を更新
        socialMediaButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.platform === platform) {
                btn.classList.add('active');
            }
        });

        sizes.forEach(size => {
            const option = document.createElement('div');
            option.className = 'size-option';
            
            const title = document.createElement('div');
            title.className = 'size-option-title';
            title.textContent = size.title;
            
            const dimensions = document.createElement('div');
            dimensions.className = 'size-option-dimensions';
            dimensions.textContent = `${size.width} x ${size.height} px（${size.ratio}）`;
            
            option.appendChild(title);
            option.appendChild(dimensions);
            
            option.addEventListener('click', () => {
                // 選択されたサイズを設定
                customWidth = size.width;
                customHeight = size.height;
                currentAspectRatio = size.ratio;
                
                // アスペクト比ボタンのアクティブ状態をすべて解除
                aspectRatioButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // モーダルを閉じて更新
                modal.style.display = 'none';
                updateCollage();
            });
            
            modalOptions.appendChild(option);
        });
        
        modal.style.display = 'block';
    }

    // デバウンス関数の実装 - 連続した呼び出しを遅延させる
    function debounce(func, wait = 100) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 更新関数をデバウンス
    const debouncedUpdateCollage = debounce(updateCollage, 50);

    // パディング、ギャップ、背景色変更のイベントハンドラ
    paddingControl.addEventListener('input', () => {
        paddingNumberInput.value = paddingControl.value;
        debouncedUpdateCollage();
    });

    paddingNumberInput.addEventListener('input', () => {
        paddingControl.value = paddingNumberInput.value;
        debouncedUpdateCollage();
    });

    gapControl.addEventListener('input', () => {
        gapNumberInput.value = gapControl.value;
        debouncedUpdateCollage();
    });

    gapNumberInput.addEventListener('input', () => {
        gapControl.value = gapNumberInput.value;
        debouncedUpdateCollage();
    });

    // 角丸スライダーの連動
    cornerRadiusControl.addEventListener('input', () => {
        cornerRadiusNumberInput.value = cornerRadiusControl.value;
        debouncedUpdateCollage();
    });

    cornerRadiusNumberInput.addEventListener('input', () => {
        cornerRadiusControl.value = cornerRadiusNumberInput.value;
        debouncedUpdateCollage();
    });

    // 背景色の変更
    bgColorControl.addEventListener('input', () => {
        const color = bgColorControl.value;
        colorPreview.style.backgroundColor = color;
        // プリセットと一致する場合はアクティブに
        colorPresets.forEach(preset => {
            if (preset.dataset.color.toLowerCase() === color.toLowerCase()) {
                colorPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            }
        });
        debouncedUpdateCollage();
    });

    // カラーピッカーボタン
    colorPickerBtn.addEventListener('click', () => {
        bgColorControl.click();
    });

    // カラープリセットの設定
    colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            const color = preset.dataset.color;
            bgColorControl.value = color;
            colorPreview.style.backgroundColor = color;
            updateCollage(); // プリセット選択は即時更新
        });
    });

    // ドラッグ＆ドロップのイベントハンドラ
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        handleFiles(files);
    });

    // クリックでファイル選択
    dropZone.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    // ファイル処理
    function handleFiles(files) {
        if (images.length + files.length > 3) {
            alert('最大3枚までアップロードできます');
            return;
        }

        // アップロード開始時に先にプレースホルダーを作成
        const placeholders = [];
        files.forEach(file => {
            // 仮の画像オブジェクトを作成（実際の画像はまだロードされていない）
            const placeholder = new Image();
            placeholder.dataset.loading = "true"; // ロード中フラグを設定
            placeholders.push(placeholder);
            images.push(placeholder);
        });
        
        // プレースホルダーを先に表示
        updateUploadedImages();

        // 実際の画像ファイルを読み込む
        files.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    // 読み込み完了後、プレースホルダーを実際の画像で置き換え
                    const index = images.indexOf(placeholders[idx]);
                    if (index !== -1) {
                        images[index] = img;
                        updateUploadedImages();
                    }
                    
                    if (images.length >= 2) {
                        collageSection.style.display = 'block';
                        generateCollage();
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    }

    // アップロードされた画像の表示を更新
    function updateUploadedImages() {
        uploadedImages.innerHTML = '';
        images.forEach((img, index) => {
            const container = document.createElement('div');
            container.className = 'image-container';
            
            // ローディング中かどうかを確認
            const isLoading = img.dataset && img.dataset.loading === "true";
            
            // ローディング表示を追加
            if (isLoading) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'image-loading';
                const spinner = document.createElement('div');
                spinner.className = 'image-spinner';
                loadingDiv.appendChild(spinner);
                container.appendChild(loadingDiv);
            }
            
            const imgElement = document.createElement('img');
            if (!isLoading) {
                imgElement.src = img.src;
            }
            
            const actions = document.createElement('div');
            actions.className = 'image-actions';
            
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-times"></i>';
            deleteButton.onclick = () => {
                images.splice(index, 1);
                updateUploadedImages();
                if (images.length < 2) {
                    collageSection.style.display = 'none';
                } else {
                    generateCollage();
                }
            };
            
            const changeButton = document.createElement('button');
            changeButton.innerHTML = '<i class="fas fa-pencil"></i>';
            changeButton.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        // 既存の画像をローディング状態に変更
                        images[index].dataset = images[index].dataset || {};
                        images[index].dataset.loading = "true";
                        updateUploadedImages();
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const newImg = new Image();
                            newImg.onload = () => {
                                // 既存の画像を新しい画像に置き換え
                                images[index] = newImg;
                                // コラージュを更新
                                updateUploadedImages();
                                generateCollage();
                            };
                            newImg.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            };
            
            actions.appendChild(deleteButton);
            actions.appendChild(changeButton);
            container.appendChild(imgElement);
            container.appendChild(actions);
            uploadedImages.appendChild(container);
        });
    }

    // コラージュ生成
    function generateCollage() {
        if (images.length < 2) return;

        // レイアウトパターンの生成
        const layouts = generateLayouts();
        layoutOptions.innerHTML = '';
        
        layouts.forEach((layout, index) => {
            // レイアウトパターンを描画するためのキャンバスを作成
            const layoutCanvas = document.createElement('canvas');
            const layoutCtx = layoutCanvas.getContext('2d');
            layoutCanvas.width = 100;
            layoutCanvas.height = 100;
            
            // パターン背景を描画
            layoutCtx.fillStyle = '#f3f4f6';
            layoutCtx.fillRect(0, 0, layoutCanvas.width, layoutCanvas.height);
            
            // レイアウト枠を描画
            layoutCtx.fillStyle = '#D5D5D5';
            
            // レイアウトタイプに基づいてパターンを描画
            const padding = 10;
            const gap = 4;
            const availableWidth = layoutCanvas.width - (padding * 2);
            const availableHeight = layoutCanvas.height - (padding * 2);
            
            layout.positions.forEach((pos) => {
                const x = padding + (pos.x * availableWidth);
                const y = padding + (pos.y * availableHeight);
                let width = pos.width * availableWidth;
                let height = pos.height * availableHeight;
                
                // 間隔を考慮
                if (pos.x + pos.width < 1) width -= gap;
                if (pos.y + pos.height < 1) height -= gap;
                
                layoutCtx.fillRect(x, y, width, height);
            });
            
            // 通常の画像オプションとして追加
            const img = document.createElement('img');
            img.src = layoutCanvas.toDataURL();
            img.alt = `Layout option ${index + 1}`;
            img.title = layout.type;
            img.dataset.layoutType = layout.type;
            
            img.onclick = () => {
                // すべてのオプションから選択状態を解除
                document.querySelectorAll('#layoutOptions img').forEach(image => {
                    image.style.borderColor = '#e0e0e0';
                });
                
                // 選択されたオプションを強調表示
                img.style.borderColor = '#3498db';
                
                currentLayout = layout;
                updateCollage();
            };
            
            // 現在選択されているレイアウトを強調表示
            if (currentLayout && layout.type === currentLayout.type) {
                img.style.borderColor = '#3498db';
            }
            
            layoutOptions.appendChild(img);
        });

        // 最初のレイアウトを選択
        if (layouts.length > 0) {
            currentLayout = layouts[0];
            updateCollage();
            
            // 最初のレイアウトオプションを視覚的にアクティブに
            const firstLayoutImg = document.querySelector('#layoutOptions img');
            if (firstLayoutImg) {
                firstLayoutImg.style.borderColor = '#3498db';
            }
        }
    }

    // レイアウトパターンの生成
    function generateLayouts() {
        const layouts = [];
        
        if (images.length === 2) {
            // 2枚のレイアウト
            layouts.push({
                type: 'vertical-2',
                positions: [
                    { x: 0, y: 0, width: 1, height: 0.5 },
                    { x: 0, y: 0.5, width: 1, height: 0.5 }
                ]
            });
            layouts.push({
                type: 'horizontal-2',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 1 },
                    { x: 0.5, y: 0, width: 0.5, height: 1 }
                ]
            });
        } else if (images.length === 3) {
            // 3枚のレイアウト
            layouts.push({
                type: 'vertical-3',
                positions: [
                    { x: 0, y: 0, width: 1, height: 1/3 },
                    { x: 0, y: 1/3, width: 1, height: 1/3 },
                    { x: 0, y: 2/3, width: 1, height: 1/3 }
                ]
            });
            layouts.push({
                type: 'horizontal-3',
                positions: [
                    { x: 0, y: 0, width: 1/3, height: 1 },
                    { x: 1/3, y: 0, width: 1/3, height: 1 },
                    { x: 2/3, y: 0, width: 1/3, height: 1 }
                ]
            });
            layouts.push({
                type: '1-top-2-bottom',
                positions: [
                    { x: 0, y: 0, width: 1, height: 0.5 },
                    { x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
                ]
            });
            layouts.push({
                type: '2-top-1-bottom',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { x: 0, y: 0.5, width: 1, height: 0.5 }
                ]
            });
            layouts.push({
                type: '1-left-2-right',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 1 },
                    { x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
                ]
            });
            layouts.push({
                type: '2-left-1-right',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 0.5 },
                    { x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0, width: 0.5, height: 1 }
                ]
            });
        }

        return layouts;
    }

    // レイアウトの描画
    function drawLayout(canvas, ctx, layout) {
        let canvasWidth, canvasHeight;
        
        if (customWidth > 0 && customHeight > 0) {
            // カスタムサイズ（SNS用）が指定されている場合
            const scale = 600 / Math.max(customWidth, customHeight); // 表示サイズに合わせてスケール
            canvasWidth = customWidth * scale;
            canvasHeight = customHeight * scale;
        } else {
            // 通常のアスペクト比を使用
            const [widthRatio, heightRatio] = currentAspectRatio.split(':').map(Number);
            canvasWidth = 600;
            canvasHeight = 600 * (heightRatio / widthRatio);
        }
        
        // キャンバスのサイズを設定
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        const padding = parseInt(paddingControl.value); // 外側余白
        const gap = parseInt(gapControl.value); // 写真間隔
        const bgColor = bgColorControl.value;

        // 背景の描画
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // レイアウトに基づいて描画方法を選択
        if (layout.type === 'vertical-2' || layout.type === 'vertical-3') {
            drawVerticalLayout(canvas, ctx, layout, padding, gap, bgColor);
        } else if (layout.type === 'horizontal-2' || layout.type === 'horizontal-3') {
            drawHorizontalLayout(canvas, ctx, layout, padding, gap, bgColor);
        } else {
            drawComplexLayout(canvas, ctx, layout, padding, gap, bgColor);
        }
    }

    // 垂直レイアウト（上下に並べる）の描画
    function drawVerticalLayout(canvas, ctx, layout, padding, gap, bgColor) {
        const count = layout.positions.length; // 画像の数
        
        // 利用可能な描画領域
        const totalHeight = canvas.height - (padding * 2) - (gap * (count - 1)); // 合計の高さから全ての余白を引く
        const singleHeight = totalHeight / count; // 1枚あたりの高さ
        const width = canvas.width - (padding * 2); // 幅は左右の余白を引いたもの
        
        // 各画像を描画
        layout.positions.forEach((pos, index) => {
            if (images[index]) {
                const x = padding;
                const y = padding + (index * (singleHeight + gap));
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[index], x, y, width, singleHeight);
            }
        });
    }
    
    // 水平レイアウト（左右に並べる）の描画
    function drawHorizontalLayout(canvas, ctx, layout, padding, gap, bgColor) {
        const count = layout.positions.length; // 画像の数
        
        // 利用可能な描画領域
        const totalWidth = canvas.width - (padding * 2) - (gap * (count - 1)); // 合計の幅から全ての余白を引く
        const singleWidth = totalWidth / count; // 1枚あたりの幅
        const height = canvas.height - (padding * 2); // 高さは上下の余白を引いたもの
        
        // 各画像を描画
        layout.positions.forEach((pos, index) => {
            if (images[index]) {
                const x = padding + (index * (singleWidth + gap));
                const y = padding;
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[index], x, y, singleWidth, height);
            }
        });
    }
    
    // 複合レイアウトの描画
    function drawComplexLayout(canvas, ctx, layout, padding, gap, bgColor) {
        // 利用可能な描画領域
        const availableWidth = canvas.width - (padding * 2);
        const availableHeight = canvas.height - (padding * 2);
        
        // 中央の余白を考慮した実際の描画位置と大きさを計算
        layout.positions.forEach((pos, index) => {
            if (images[index]) {
                let x, y, width, height;
                
                if (layout.type === '1-top-2-bottom') {
                    if (index === 0) { // 上部の大きい画像
                        x = padding;
                        y = padding;
                        width = availableWidth;
                        height = (availableHeight - gap) / 2;
                    } else { // 下部の2枚
                        const bottomWidth = (availableWidth - gap) / 2;
                        x = padding + (index === 1 ? 0 : bottomWidth + gap);
                        y = padding + (availableHeight + gap) / 2;
                        width = bottomWidth;
                        height = (availableHeight - gap) / 2;
                    }
                } else if (layout.type === '2-top-1-bottom') {
                    if (index < 2) { // 上部の2枚
                        const topWidth = (availableWidth - gap) / 2;
                        x = padding + (index === 0 ? 0 : topWidth + gap);
                        y = padding;
                        width = topWidth;
                        height = (availableHeight - gap) / 2;
                    } else { // 下部の大きい画像
                        x = padding;
                        y = padding + (availableHeight + gap) / 2;
                        width = availableWidth;
                        height = (availableHeight - gap) / 2;
                    }
                } else if (layout.type === '1-left-2-right') {
                    if (index === 0) { // 左側の大きい画像
                        x = padding;
                        y = padding;
                        width = (availableWidth - gap) / 2;
                        height = availableHeight;
                    } else { // 右側の2枚
                        const rightHeight = (availableHeight - gap) / 2;
                        x = padding + (availableWidth + gap) / 2;
                        y = padding + (index === 1 ? 0 : rightHeight + gap);
                        width = (availableWidth - gap) / 2;
                        height = rightHeight;
                    }
                } else if (layout.type === '2-left-1-right') {
                    if (index < 2) { // 左側の2枚
                        const leftHeight = (availableHeight - gap) / 2;
                        x = padding;
                        y = padding + (index === 0 ? 0 : leftHeight + gap);
                        width = (availableWidth - gap) / 2;
                        height = leftHeight;
                    } else { // 右側の大きい画像
                        x = padding + (availableWidth + gap) / 2;
                        y = padding;
                        width = (availableWidth - gap) / 2;
                        height = availableHeight;
                    }
                }
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[index], x, y, width, height);
            }
        });
    }

    // object-fit: cover と同様に画像を描画する関数
    function drawImageCovered(ctx, img, x, y, width, height) {
        const imgRatio = img.width / img.height;
        const boxRatio = width / height;
        
        let sw, sh, sx, sy;
        
        if (imgRatio > boxRatio) { // 画像が横長の場合
            sh = img.height;
            sw = sh * boxRatio;
            sy = 0;
            sx = (img.width - sw) / 2;
        } else { // 画像が縦長の場合
            sw = img.width;
            sh = sw / boxRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
        }
        
        // 角丸の半径
        const cornerRadius = parseInt(cornerRadiusControl.value);
        
        if (cornerRadius > 0) {
            // 角丸のある矩形パスを作成
            ctx.save();
            ctx.beginPath();
            // 左上角
            ctx.moveTo(x + cornerRadius, y);
            // 上辺
            ctx.lineTo(x + width - cornerRadius, y);
            // 右上角
            ctx.arc(x + width - cornerRadius, y + cornerRadius, cornerRadius, Math.PI * 1.5, 0, false);
            // 右辺
            ctx.lineTo(x + width, y + height - cornerRadius);
            // 右下角
            ctx.arc(x + width - cornerRadius, y + height - cornerRadius, cornerRadius, 0, Math.PI * 0.5, false);
            // 下辺
            ctx.lineTo(x + cornerRadius, y + height);
            // 左下角
            ctx.arc(x + cornerRadius, y + height - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI, false);
            // 左辺
            ctx.lineTo(x, y + cornerRadius);
            // 左上角
            ctx.arc(x + cornerRadius, y + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5, false);
            ctx.closePath();
            
            // クリッピングパスを設定
            ctx.clip();
            
            // 画像を描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
            
            ctx.restore();
        } else {
            // 角丸なしで普通に描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
        }
    }

    // コントロールのイベントハンドラ
    paddingControl.addEventListener('input', updateCollage);
    bgColorControl.addEventListener('input', updateCollage);

    function updateCollage() {
        if (currentLayout) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            drawLayout(canvas, ctx, currentLayout);
            mainPreview.src = canvas.toDataURL();
            
            // パラメータ変更時はレイアウトオプションの再描画を行わない
        }
        resetZoom();
    }

    // レイアウトオプションを現在のアスペクト比で更新
    function updateLayoutOptions() {
        if (images.length < 2) return;
        
        const layouts = generateLayouts();
        layoutOptions.innerHTML = '';
        
        layouts.forEach((layout, index) => {
            // レイアウトパターンを描画するためのキャンバスを作成
            const layoutCanvas = document.createElement('canvas');
            const layoutCtx = layoutCanvas.getContext('2d');
            layoutCanvas.width = 100;
            layoutCanvas.height = 100;
            
            // パターン背景を描画
            layoutCtx.fillStyle = '#f3f4f6';
            layoutCtx.fillRect(0, 0, layoutCanvas.width, layoutCanvas.height);
            
            // レイアウト枠を描画
            layoutCtx.fillStyle = '#D5D5D5';
            
            // レイアウトタイプに基づいてパターンを描画
            const padding = 10;
            const gap = 4;
            const availableWidth = layoutCanvas.width - (padding * 2);
            const availableHeight = layoutCanvas.height - (padding * 2);
            
            layout.positions.forEach((pos) => {
                const x = padding + (pos.x * availableWidth);
                const y = padding + (pos.y * availableHeight);
                let width = pos.width * availableWidth;
                let height = pos.height * availableHeight;
                
                // 間隔を考慮
                if (pos.x + pos.width < 1) width -= gap;
                if (pos.y + pos.height < 1) height -= gap;
                
                layoutCtx.fillRect(x, y, width, height);
            });
            
            const img = document.createElement('img');
            img.src = layoutCanvas.toDataURL();
            img.alt = `Layout option ${index + 1}`;
            img.title = layout.type;
            img.dataset.layoutType = layout.type;
            
            // クリックイベント
            img.onclick = () => {
                // すべてのオプションから選択状態を解除
                document.querySelectorAll('#layoutOptions img').forEach(image => {
                    image.style.borderColor = '#e0e0e0';
                });
                
                // 選択されたオプションを強調表示
                img.style.borderColor = '#3498db';
                
                currentLayout = layout;
                updateCollage();
            };
            
            // 現在選択されているレイアウトを強調表示
            if (currentLayout && layout.type === currentLayout.type) {
                img.style.borderColor = '#3498db';
            }
            
            layoutOptions.appendChild(img);
        });
    }

    // リセットボタン
    resetButton.addEventListener('click', () => {
        aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.aspect-ratio-btn[data-ratio="1:1"]').classList.add('active');
        currentAspectRatio = '1:1';
        customWidth = 0;
        customHeight = 0;
        paddingControl.value = 10;
        paddingNumberInput.value = 10;
        gapControl.value = 10;
        gapNumberInput.value = 10;
        cornerRadiusControl.value = 0;
        cornerRadiusNumberInput.value = 0;
        bgColorControl.value = '#ffffff';
        colorPreview.style.backgroundColor = '#ffffff';
        colorPresets.forEach(p => p.classList.remove('active'));
        document.querySelector('.color-preset[data-color="#ffffff"]').classList.add('active');
        
        // SNSボタンのactive状態をリセット
        socialMediaButtons.forEach(btn => btn.classList.remove('active'));
        
        updateCollage();
    });

    // ダウンロードボタン
    downloadButton.addEventListener('click', () => {
        if (mainPreview.src) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let outputWidth, outputHeight;
            
            // カスタムサイズが指定されている場合はそれを使用、
            // 指定されていない場合は幅1080pxをベースにアスペクト比に応じたサイズを計算
            if (customWidth > 0 && customHeight > 0) {
                outputWidth = customWidth;
                outputHeight = customHeight;
            } else {
                const [widthRatio, heightRatio] = currentAspectRatio.split(':').map(Number);
                outputWidth = 1080; // デフォルト幅を1080pxに固定
                outputHeight = Math.round(1080 * (heightRatio / widthRatio));
            }
            
            // キャンバスのサイズを設定
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // 背景色
            ctx.fillStyle = bgColorControl.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const padding = parseInt(paddingControl.value) * (outputWidth / 500); // 500pxのプレビューからの比率で計算
            const gap = parseInt(gapControl.value) * (outputWidth / 500);
            const cornerRadius = parseInt(cornerRadiusControl.value) * (outputWidth / 500);
            
            // レイアウトに応じて画像を描画
            if (currentLayout) {
                // 利用可能な描画領域
                const availableWidth = canvas.width - (padding * 2);
                const availableHeight = canvas.height - (padding * 2);
                
                currentLayout.positions.forEach((pos, index) => {
                    if (images[index]) {
                        const x = padding + (pos.x * availableWidth);
                        const y = padding + (pos.y * availableHeight);
                        const width = pos.width * availableWidth;
                        const height = pos.height * availableHeight;
                        
                        // 間隔を考慮
                        let adjustedWidth = width;
                        let adjustedHeight = height;
                        
                        if (pos.x + pos.width < 1) adjustedWidth -= gap;
                        if (pos.y + pos.height < 1) adjustedHeight -= gap;
                        
                        // 画像を描画（角丸対応）
                        drawImageWithCorners(ctx, images[index], x, y, adjustedWidth, adjustedHeight, cornerRadius);
                    }
                });
            }
            
            // ダウンロード
            const link = document.createElement('a');
            const filename = customWidth > 0 && customHeight > 0 
                ? `collage_${outputWidth}x${outputHeight}.png` 
                : `collage_${outputWidth}x${outputHeight}_${currentAspectRatio.replace(':', 'to')}.png`;
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });
    
    // 角丸付きで画像を描画する関数（ダウンロード用）
    function drawImageWithCorners(ctx, img, x, y, width, height, cornerRadius) {
        const imgRatio = img.width / img.height;
        const boxRatio = width / height;
        
        let sw, sh, sx, sy;
        
        if (imgRatio > boxRatio) { // 画像が横長の場合
            sh = img.height;
            sw = sh * boxRatio;
            sy = 0;
            sx = (img.width - sw) / 2;
        } else { // 画像が縦長の場合
            sw = img.width;
            sh = sw / boxRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
        }
        
        if (cornerRadius > 0) {
            // 角丸のある矩形パスを作成
            ctx.save();
            ctx.beginPath();
            // 左上角
            ctx.moveTo(x + cornerRadius, y);
            // 上辺
            ctx.lineTo(x + width - cornerRadius, y);
            // 右上角
            ctx.arc(x + width - cornerRadius, y + cornerRadius, cornerRadius, Math.PI * 1.5, 0, false);
            // 右辺
            ctx.lineTo(x + width, y + height - cornerRadius);
            // 右下角
            ctx.arc(x + width - cornerRadius, y + height - cornerRadius, cornerRadius, 0, Math.PI * 0.5, false);
            // 下辺
            ctx.lineTo(x + cornerRadius, y + height);
            // 左下角
            ctx.arc(x + cornerRadius, y + height - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI, false);
            // 左辺
            ctx.lineTo(x, y + cornerRadius);
            // 左上角
            ctx.arc(x + cornerRadius, y + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5, false);
            ctx.closePath();
            
            // クリッピングパスを設定
            ctx.clip();
            
            // 画像を描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
            
            ctx.restore();
        } else {
            // 角丸なしで普通に描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
        }
    }

    // ズームイン・アウトボタンのイベントリスナー
    zoomInBtn.addEventListener('click', () => {
        // 元のサイズがまだ保存されていない場合に保存
        if (originalWidth === 0 && mainPreview.naturalWidth > 0) {
            originalWidth = mainPreview.naturalWidth;
            originalHeight = mainPreview.naturalHeight;
        }
        
        // ズームイン: 10%ずつ拡大（最大200%まで）
        currentZoom = Math.min(currentZoom + 10, 200);
        
        // セレクトボックスの値を更新
        updateZoomSelect();
        
        // ズームレベルを適用
        applyZoom();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        // 元のサイズがまだ保存されていない場合に保存
        if (originalWidth === 0 && mainPreview.naturalWidth > 0) {
            originalWidth = mainPreview.naturalWidth;
            originalHeight = mainPreview.naturalHeight;
        }
        
        // ズームアウト: 10%ずつ縮小（最小30%まで）
        currentZoom = Math.max(currentZoom - 10, 30);
        
        // セレクトボックスの値を更新
        updateZoomSelect();
        
        // ズームレベルを適用
        applyZoom();
    });

    // ズームセレクトのイベントリスナー
    zoomSelect.addEventListener('change', () => {
        const value = zoomSelect.value;
        
        // 元のサイズがまだ保存されていない場合に保存
        if (originalWidth === 0 && mainPreview.naturalWidth > 0) {
            originalWidth = mainPreview.naturalWidth;
            originalHeight = mainPreview.naturalHeight;
        }
        
        // 選択された値に基づいてズームレベルを設定
        currentZoom = parseInt(value);
        
        // ズームレベルを適用
        applyZoom();
    });

    // ズームレベルをプレビュー画像に適用
    function applyZoom() {
        if (mainPreview.src) {
            const previewContainer = document.querySelector('.preview-container');

            if (currentZoom === 100) {
                // 100%の場合は元のスタイルに戻す
                mainPreview.style.width = '';
                mainPreview.style.height = '';
                mainPreview.style.maxWidth = '100%';
                mainPreview.style.maxHeight = '100%';
                previewContainer.scrollTop = 0;
                previewContainer.scrollLeft = 0;
            } else {
                // まず100%状態に戻して基準サイズを取得
                mainPreview.style.width = '';
                mainPreview.style.height = '';
                mainPreview.style.maxWidth = '100%';
                mainPreview.style.maxHeight = '100%';
                
                // 基準サイズを取得
                const baseWidth = mainPreview.offsetWidth || mainPreview.naturalWidth;
                const baseHeight = mainPreview.offsetHeight || mainPreview.naturalHeight;
                
                // スケールファクターを適用
                const scaleFactor = currentZoom / 100;
                mainPreview.style.width = `${baseWidth * scaleFactor}px`;
                mainPreview.style.height = `${baseHeight * scaleFactor}px`;
                
                // 拡大時のみmax制限を解除
                if (currentZoom > 100) {
                    mainPreview.style.maxWidth = 'none';
                    mainPreview.style.maxHeight = 'none';
                }
                
                // スクロール位置を調整
                previewContainer.scrollTop = 0;
                previewContainer.scrollLeft = 0;
                const scrollX = (mainPreview.offsetWidth - previewContainer.clientWidth) / 2;
                const scrollY = (mainPreview.offsetHeight - previewContainer.clientHeight) / 2;
                if (scrollX > 0) previewContainer.scrollLeft = scrollX;
                if (scrollY > 0) previewContainer.scrollTop = scrollY;
            }
        }
    }
    
    // セレクトボックスの値を現在のズームレベルに合わせて更新
    function updateZoomSelect() {
        // 現在のズームに一致する値があれば選択
        if ([50, 100, 150, 200].includes(currentZoom)) {
            zoomSelect.value = currentZoom.toString();
        } else {
            // カスタムオプションの追加・更新
            let customOption = null;
            
            // 既存のカスタムオプションを確認
            for (let i = 0; i < zoomSelect.options.length; i++) {
                if (zoomSelect.options[i].value === 'custom') {
                    customOption = zoomSelect.options[i];
                    break;
                }
            }
            
            // カスタムオプションがなければ作成
            if (!customOption) {
                customOption = document.createElement('option');
                customOption.value = 'custom';
                zoomSelect.appendChild(customOption);
            }
            
            // カスタムオプションを更新して選択
            customOption.textContent = `${currentZoom}%`;
            zoomSelect.value = 'custom';
        }
    }

    // ズームレベルをリセット
    function resetZoom() {
        currentZoom = 100;
        originalWidth = 0;
        originalHeight = 0;
        if (mainPreview) {
            mainPreview.style.width = '';
            mainPreview.style.height = '';
            mainPreview.style.maxWidth = '100%';
            mainPreview.style.maxHeight = '100%';
        }
        
        // セレクトボックスも100%に戻す
        zoomSelect.value = '100';
        
        // カスタムオプションが存在すれば削除
        const customOption = zoomSelect.querySelector('option[value="custom"]');
        if (customOption) {
            customOption.remove();
        }
    }
});
