# Drawing a nuclear fission / transmutation process diagram (U-238 → U-239 → Np-239 → Pu-239 → fission)
# This will create a clear flow diagram with nucleus schematics and arrows, annotated in Chinese.
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import matplotlib

matplotlib.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'STSong', 'Arial Unicode MS']  # 常见中文字体
matplotlib.rcParams['axes.unicode_minus'] = False  # 解决负号显示为方块

plt.rcParams.update({'font.size': 12})

fig, ax = plt.subplots(figsize=(14,4))
ax.axis('off')

# positions for five stages
xs = [0.9, 3.0, 5.1, 7.2, 9.5]

def draw_nucleus(center, protons, neutrons, label, excited=False):
    x, y = center
    # nucleus circle
    circ = patches.Circle((x,y), 0.6, fill=False, linewidth=2)
    ax.add_patch(circ)
    # proton and neutron text blocks
    ax.text(x-0.35, y+0.15, f"质子 p = {protons}", fontsize=10, ha='left', va='center')
    ax.text(x-0.35, y-0.15, f"中子 n = {neutrons}", fontsize=10, ha='left', va='center')
    # isotope label above
    ax.text(x, y+0.9, label, fontsize=13, ha='center', va='center', fontweight='bold')
    # small marks for excitation
    if excited:
        for angle in np.linspace(0, 2*np.pi, 10, endpoint=False):
            ax.plot([x+0.6*np.cos(angle), x+0.9*np.cos(angle)], [y+0.6*np.sin(angle), y+0.9*np.sin(angle)], linewidth=1.2)

# draw stages
draw_nucleus((xs[0], 2.2), 92, 146, "铀-238 (U-238)")
draw_nucleus((xs[1], 2.2), 92, 147, "铀-239 (U-239)\n（俘获中子，激发状态）", excited=True)
draw_nucleus((xs[2], 2.2), 93, 146, "镎-239 (Np-239)\n（β⁻ 衰变）")
draw_nucleus((xs[3], 2.2), 94, 145, "钚-239 (Pu-239)\n（第二次 β⁻ 衰变）")
# fission stage: split nucleus into two fragments and show emitted neutrons
x5 = xs[4]
ax.text(x5, 3.05, "裂变示意", fontsize=13, fontweight='bold', ha='center')
# two fragments
frag1 = patches.Circle((x5-0.4, 1.85), 0.5, fill=False, linewidth=1.8)
frag2 = patches.Circle((x5+0.6, 1.85), 0.4, fill=False, linewidth=1.8)
ax.add_patch(frag1); ax.add_patch(frag2)
ax.text(x5-0.4, 1.85, "裂变产物A\n(≈中子/质子比不同)", ha='center', va='center', fontsize=10)
ax.text(x5+0.6, 1.85, "裂变产物B\n(≈中子/质子比不同)", ha='center', va='center', fontsize=10)
# emitted neutrons arrows
for i, dx in enumerate([-0.2, 0.2, 0.8]):
    ax.annotate("", xy=(x5+1.6+0.15*i, 1.85+0.1*i), xytext=(x5+1.0+0.15*i, 1.85+0.05*i),
                arrowprops=dict(arrowstyle="->", linewidth=1.2))

ax.text(x5+1.9, 1.95, "游离中子\n（可继续俘获或引发裂变）", fontsize=10, ha='left', va='center')

# arrows between main stages with labels
def arrow_between(x1, x2, text):
    ax.annotate("", xy=(x2-0.45, 2.2), xytext=(x1+0.45, 2.2), arrowprops=dict(arrowstyle="->", linewidth=1.5))
    ax.text((x1+x2)/2, 2.45, text, fontsize=11, ha='center', va='center')

arrow_between(xs[0], xs[1], "俘获中子\n(+1 中子)")
arrow_between(xs[1], xs[2], "β⁻ 衰变\n(中子→质子 + 电子 + 反中微子)")
arrow_between(xs[2], xs[3], "再次 β⁻ 衰变\n(中子→质子 + 电子 + 反中微子)")
arrow_between(xs[3], xs[4], "用于裂变或做燃料\n(吸收快中子并裂变释放能量)")

# footer explanatory text box
foot = ("流程要点：\n"
        "1) 铀-238 经中子俘获变为铀-239（不稳定）。\n"
        "2) 铀-239 通过两次 β⁻ 衰变 → 镎-239 → 钚-239。\n"
        "3) 钚-239 可发生裂变，释放能量和多个中子，"
        "这些中子可继续被 U-238 俘获或引发更多裂变（链式反应）。\n"
        "注：图中 n 表示中子数，p 表示质子数。")
ax.text(0.5, 0.15, foot, fontsize=10, ha='left', va='bottom')

plt.tight_layout()
plt.show()
