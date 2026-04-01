Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile('C:\Users\Abcom\Downloads\Gemini_Generated_Image_gm2qdzgm2qdzgm2q.png')

# 512x512
$bmp512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.DrawImage($src, 0, 0, 512, 512)
$bmp512.Save('C:\Users\Abcom\Desktop\Mathy\ai-games\public\icons\icon-512x512.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$bmp512.Dispose()

# 192x192
$bmp192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($src, 0, 0, 192, 192)
$bmp192.Save('C:\Users\Abcom\Desktop\Mathy\ai-games\public\icons\icon-192x192.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g192.Dispose()
$bmp192.Dispose()

$src.Dispose()
Write-Host 'Done - icons created at public/icons/'
