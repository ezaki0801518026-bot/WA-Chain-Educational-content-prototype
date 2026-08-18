import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import media from '../../data/media.json'
import VideoEmbed from '../components/VideoEmbed.jsx'
import Reveal from '../components/Reveal.jsx'
import ContactEmail from '../components/ContactEmail.jsx'
import SocialIcon, { socialLabel } from '../components/SocialIcon.jsx'
import styles from './AboutPage.module.css'
import { asset } from '../utils/asset.js'

const img = (name) => encodeURI(`/images/hero/${name}`)

// The page opens on the whole team, not on a subset of members at work —
// the first face you meet should never prompt "why those two?".
const HERO_IMG = {
  src: img('team-photo-2026-stairs.jpg'),
  alt: 'The four members of WA-Chain on a staircase, one holding a sheet of washi',
}
const MAKING_IMG = { src: img('メンバーが和紙を漉く様子.jpg'), alt: 'WA-Chain members forming washi sheets by hand' }
const CRISIS_IMG = { src: img('楮の畑を上から見た写真.jpg'), alt: 'A kōzo field in a misty mountain village' }
const INSIGHT_IMG = {
  src: img('実際に和紙で修復された火事でダメになってしまった本の作品.JPG'),
  alt: 'A fire-damaged book page conserved with washi',
}
const MATERIAL_IMG = { src: img('漂泊した綺麗な楮繊維.JPG'), alt: 'Bleached kōzo fiber, close up' }
const INTRO_IMG = {
  src: img('和紙の見本帳.jpg'),
  alt: 'A numbered washi sample book, showing many weights and textures side by side',
}
const LUISA_IMG = {
  src: img('ノルウェーで学ぶ様子.jpg'),
  alt: 'WA-Chain members showing washi samples to a conservator in the Gunnerus Library studio',
}
const PITCH_IMG = {
  src: img('ノルウェーの授業でピッチする様子.jpg'),
  alt: 'Two WA-Chain members pitching in Norway, in front of a slide reading "WA-Chain — Optimizing Paper Selection for Art Restoration"',
}

// Group shot that opens the team tab, above the individual member cards.
const TEAM_IMG = {
  src: img('team-photo-2026.jpg'),
  alt: 'The four WA-Chain members standing together, each holding a roll of washi',
}

const WASHI_HIST_IMG = {
  src: img('島根安部記念館の和紙.jpg'),
  alt: 'Racks of colourful decorated washi at the Abe Eishirō Memorial Museum, Shimane',
}

// Field-notes gallery: washi, workshops, and pitches from research trips.
const GALLERY = [
  {
    src: img('和紙漉き体験.jpg'),
    alt: 'Hands resting on the edge of a papermaking vat full of pulp',
    capKey: 'aboutGallery1Cap',
  },
  { ...MAKING_IMG, capKey: 'aboutGallery2Cap' },
  {
    src: img('安部記念館いろいろな和紙.jpg'),
    alt: 'Long washi sheets hanging on display at the Abe Eishirō Memorial Museum',
    capKey: 'aboutGallery3Cap',
  },
  {
    src: img('楮、三椏.jpg'),
    alt: 'Bundles of kōzo and mitsumata bark drying under the eaves of a farmhouse',
    capKey: 'aboutGallery4Cap',
  },
  {
    src: img('ノルウェーで修復した作品.jpg'),
    alt: 'Books from 1922 under conservation with washi in Norway',
    capKey: 'aboutGallery5Cap',
  },
  { ...PITCH_IMG, capKey: 'aboutGallery6Cap' },
]

// Field photos pinned to timeline entries — proof the team was actually
// there. At most two per entry sit in the row; anything beyond that lives
// in the sections below (awards figure, field-notes gallery).
const TL_IMAGES = {
  2: [
    {
      src: img('みらい創造ワークショップ10万円.jpg'),
      alt: 'The four members receiving the ¥100,000 Special Prize on stage at the Mirai Sōzō Workshop',
      // Faces sit around a third of the way down a tall frame; the default
      // centred crop lands on the award board and cuts them off.
      focusY: '30%',
    },
    { src: img('みらい創造ワークショップチラシ.png'), alt: 'Flyer for the Mirai Sōzō Workshop 2025' },
  ],
  3: [
    {
      src: img('島根大学にてピッチする様子小松.jpg'),
      alt: 'Hiroto Komatsu presenting a washi slide at Shimane University',
    },
    {
      src: img('和紙漉く様子小松in島根.jpg'),
      alt: 'Hiroto Komatsu examining a freshly formed sheet at the Izumo Mingei-shi workshop, Shimane',
    },
  ],
  4: [
    { src: img('グンネラスp図書館入口.jpg'), alt: 'The snowy entrance of the Gunnerus Library, Trondheim' },
    {
      src: img('ノルウェーグンネラス図書館で和紙を使う様子.jpg'),
      alt: 'Conservation tools, washi, and historical documents on a workbench at the Gunnerus Library',
    },
  ],
  5: [
    {
      src: img('ピッチ in oxford宮本.jpg'),
      alt: 'Mayu Miyamoto pitching at the University of Oxford, in front of a "Paper Doctor" slide',
    },
    {
      src: img('oxford said business schoolにて宮本.jpg'),
      alt: 'Mayu Miyamoto with mentors at the Saïd Business School, University of Oxford',
    },
  ],
  6: [
    {
      src: img('hultprize発表様子.jpg'),
      alt: 'Pitching at the Hult Prize, in front of a fiber-density slide',
      portrait: true,
    },
  ],
  7: [
    { src: img('水につけている楮.jpg'), alt: 'Kōzo bark soaking in a water bath at Kashiki Paper Mill' },
    { src: img('紙の博物館.jpg'), alt: 'The wooden sign of the Ino-chō Paper Museum in Kōchi' },
  ],
  8: [
    {
      src: img('モンゴル視察団発表.jpg'),
      alt: 'Komatsu and Miyamoto presenting WA-Chain with Mongolian-language slides to a visiting delegation',
    },
  ],
  9: [
    {
      src: img('山形学会.jpg'),
      alt: 'The signboard of the 48th annual meeting of the Japan Society for the Conservation of Cultural Property, Yamagata',
      portrait: true,
    },
  ],
  10: [{ src: img('和紙の見本帳.jpg'), alt: 'Leafing through a numbered washi sample book' }],
}

// Timeline entry -> the News article covering it. Entries with no article
// (team formed, Hult Prize, ongoing research) are simply absent.
const TL_NEWS = {
  2: '2025-12-mirai-sozo',
  3: '2026-01-shimane',
  4: '2026-02-europe',
  5: '2026-02-europe',
  7: '2026-03-kochi',
  8: '2026-05-mongolia',
  9: '2026-06-yamagata',
}

// One href serves both builds: the course app's hash router resolves
// #/news/<id> as a route, and the standalone About build has a small
// router of its own that recognises the same shape. Nothing here leaves
// the page it is on, so the standalone build never exposes the course.
const newsHref = (id) => `#/news/${id}`

const TABS = ['mission', 'history', 'team']

const tabLabelKey = (id) => `aboutTab${id.charAt(0).toUpperCase() + id.slice(1)}`
const STATS = ['1', '2', '3']
const PROPS = ['1', '2', '3']
const RECORDS = ['1', '2', '3', '4']
const TIMELINE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

// Top row is Ezaki and Komatsu; Miyamoto and Iimura follow. `major` is
// shown as its own line under the role — every member is a student, so
// the field they study is part of who is speaking.
const MEMBERS = [
  {
    name: '江崎 祥史',
    reading: 'えざき よしふみ',
    majorKey: 'aboutMember4Major',
    photo: img('member-ezaki-2026.jpg'),
    track: 'foundations',
    key: '4',
    links: [
      { network: 'linkedin', url: 'https://www.linkedin.com/in/%E7%A5%A5%E5%8F%B2-%E6%B1%9F%E5%B4%8E-entre/' },
    ],
  },
  {
    name: '小松 洋翔',
    reading: 'こまつ ひろと',
    majorKey: 'aboutMember1Major',
    photo: img('member-komatsu-2026.jpg'),
    track: 'foundations',
    key: '1',
    links: [
      { network: 'linkedin', url: 'https://www.linkedin.com/in/hiroto-komatsu-600573380' },
      { network: 'facebook', url: 'https://www.facebook.com/profile.php?id=61560287393335' },
    ],
  },
  {
    name: '宮本 真優',
    reading: 'みやもと まゆ',
    majorKey: 'aboutMember2Major',
    photo: img('member-miyamoto-2026.jpg'),
    track: 'diagnostics',
    key: '2',
    links: [{ network: 'linkedin', url: 'https://www.linkedin.com/in/mayu-miyamoto-762580341/' }],
  },
  {
    name: '飯村 太陽',
    reading: 'いいむら たいよう',
    majorKey: 'aboutMember3Major',
    photo: img('member-iimura-2026.jpg'),
    track: 'practice',
    key: '3',
    links: [
      { network: 'linkedin', url: 'https://www.linkedin.com/in/%E5%A4%AA%E9%99%BD-%E9%A3%AF%E6%9D%91-430a60405/' },
    ],
  },
]

// `initialTab` / `onTabChange` let the standalone build put a reader back
// on the tab they left from when they return from an activity report.
function AboutPage({ initialTab = 'mission', onTabChange }) {
  const { t, lang } = useLanguage()
  const [tab, setTab] = useState(initialTab)
  const tabBarRef = useRef(null)
  const aboutVideo = media.aboutVideo

  const selectTab = (id) => {
    setTab(id)
    onTabChange?.(id)
  }

  // Moving on from the foot of a tab has to land at the top of the next
  // one, otherwise the reader arrives at its end.
  const goToTab = (id) => {
    selectTab(id)
    tabBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tabIndex = TABS.indexOf(tab)
  const prevTab = tabIndex > 0 ? TABS[tabIndex - 1] : null
  const nextTab = tabIndex < TABS.length - 1 ? TABS[tabIndex + 1] : null

  return (
    <>
      {/* Words beside the photo, never on top of it. A letterboxed hero had
          to crop the staircase vertically, and how much it cropped depended
          on the window's proportions — which is exactly what kept pushing
          faces out of frame. Here the photo column is tall rather than wide,
          so the crop eats the empty railings at the sides instead. */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.heroEyebrow}>{t('aboutEyebrow')}</p>
            <h1 className={styles.heroHeadline}>{t('aboutHeadline')}</h1>
            <p className={styles.heroLede}>{t('aboutLede')}</p>
          </div>
          <figure className={styles.heroFigure}>
            <img className={styles.heroImg} src={asset(HERO_IMG.src)} alt={HERO_IMG.alt} />
          </figure>
        </div>
      </header>

      <div className={styles.page}>
        <nav className={styles.tabBar} aria-label="page sections" ref={tabBarRef}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
            onClick={() => selectTab(id)}
            aria-pressed={tab === id}
          >
            {t(`aboutTab${id.charAt(0).toUpperCase() + id.slice(1)}`)}
          </button>
        ))}
      </nav>

      {tab === 'mission' && (
        <div className={styles.tabContent}>
          <Reveal className={styles.missionCard}>
            <p className={styles.missionLabel}>{t('aboutMissionLabel')}</p>
            <p className={styles.missionText}>{t('aboutMission')}</p>
          </Reveal>

          {/* What washi is, before what is happening to it — so the decline
              that follows lands against something the reader values. */}
          <Reveal as="section" className={styles.section}>
            <div className={styles.splitBlock}>
              <div className={styles.splitText}>
                <p className={`${styles.sectionEyebrow} ${styles.eyebrowFoundations}`}>{t('aboutIntroEyebrow')}</p>
                <h2 className={styles.sectionTitle}>{t('aboutIntroTitle')}</h2>
                <p className={styles.sectionBody}>{t('aboutIntroBody')}</p>
              </div>
              <figure className={styles.splitFigure}>
                <img className={styles.splitImg} src={asset(INTRO_IMG.src)} alt={INTRO_IMG.alt} loading="lazy" />
              </figure>
            </div>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <div className={styles.splitBlock}>
              <div className={styles.splitText}>
                <p className={`${styles.sectionEyebrow} ${styles.eyebrowPractice}`}>{t('aboutCrisisEyebrow')}</p>
                <h2 className={styles.sectionTitle}>{t('aboutCrisisTitle')}</h2>
                <p className={styles.sectionBody}>{t('aboutCrisisBody')}</p>
              </div>
              <figure className={styles.splitFigure}>
                <img className={styles.splitImg} src={asset(CRISIS_IMG.src)} alt={CRISIS_IMG.alt} loading="lazy" />
              </figure>
            </div>
            <div className={styles.statRow}>
              {STATS.map((n) => (
                <div key={n} className={`${styles.bigStat} ${styles.track_practice}`}>
                  <span className={styles.bigStatValue}>{t(`aboutStat${n}Value`)}</span>
                  <span className={styles.bigStatLabel}>{t(`aboutStat${n}Label`)}</span>
                </div>
              ))}
            </div>
            <blockquote className={styles.quote}>
              <p className={styles.quoteText}>{t('aboutQuote1Text')}</p>
              <cite className={styles.quoteAttr}>{t('aboutQuote1Attr')}</cite>
            </blockquote>
            <blockquote className={styles.quote}>
              <p className={styles.quoteText}>{t('aboutQuote2Text')}</p>
              <cite className={styles.quoteAttr}>{t('aboutQuote2Attr')}</cite>
            </blockquote>
            <p className={styles.sectionBody}>{t('aboutCrisisAfterQuotes')}</p>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <div className={`${styles.splitBlock} ${styles.splitReverse}`}>
              <div className={styles.splitText}>
                <p className={`${styles.sectionEyebrow} ${styles.eyebrowDiagnostics}`}>{t('aboutWashiHistEyebrow')}</p>
                <h2 className={styles.sectionTitle}>{t('aboutWashiHistTitle')}</h2>
                <p className={styles.sectionBody}>{t('aboutWashiHistBody')}</p>
              </div>
              <figure className={styles.splitFigure}>
                <img
                  className={`${styles.splitImg} ${styles.splitImgTall}`}
                  src={asset(WASHI_HIST_IMG.src)}
                  alt={WASHI_HIST_IMG.alt}
                  loading="lazy"
                />
              </figure>
            </div>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <div className={`${styles.splitBlock} ${styles.splitReverse}`}>
              <div className={styles.splitText}>
                <p className={`${styles.sectionEyebrow} ${styles.eyebrowFoundations}`}>{t('aboutInsightEyebrow')}</p>
                <h2 className={styles.sectionTitle}>{t('aboutInsightTitle')}</h2>
                <p className={styles.sectionBody}>{t('aboutInsightBody')}</p>
              </div>
              <figure className={styles.splitFigure}>
                <img className={styles.splitImg} src={asset(INSIGHT_IMG.src)} alt={INSIGHT_IMG.alt} loading="lazy" />
              </figure>
            </div>
            <div className={styles.propGrid}>
              {PROPS.map((n, i) => (
                <div
                  key={n}
                  className={`${styles.propCard} ${styles[`track_${['foundations', 'diagnostics', 'practice'][i]}`]}`}
                >
                  <span className={styles.propNumber}>0{n}</span>
                  <h3 className={styles.propTitle}>{t(`aboutProp${n}Title`)}</h3>
                  <p className={styles.propDesc}>{t(`aboutProp${n}Desc`)}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Why us, placed after the case for the material rather than
              before it — the founder's story explains the team, not washi. */}
          <Reveal as="section" className={styles.section}>
            <p className={`${styles.sectionEyebrow} ${styles.eyebrowFoundations}`}>{t('aboutOriginEyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('aboutOriginTitle')}</h2>
            <p className={styles.sectionBody}>{t('aboutOriginBody')}</p>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <div className={styles.splitBlock}>
              <div className={styles.splitText}>
                <p className={`${styles.sectionEyebrow} ${styles.eyebrowPractice}`}>{t('aboutLuisaEyebrow')}</p>
                <h2 className={styles.sectionTitle}>{t('aboutLuisaTitle')}</h2>
                <p className={styles.sectionBody}>{t('aboutLuisaBody')}</p>
              </div>
              <figure className={styles.splitFigure}>
                <img className={styles.splitImg} src={asset(LUISA_IMG.src)} alt={LUISA_IMG.alt} loading="lazy" />
              </figure>
            </div>
            <blockquote className={styles.quote}>
              <p className={styles.quoteText}>{t('aboutLuisaQuote')}</p>
              <cite className={styles.quoteAttr}>{t('aboutLuisaQuoteAttr')}</cite>
            </blockquote>
            <p className={styles.sectionBody}>{t('aboutLuisaAfter')}</p>
          </Reveal>

          <Reveal as="section" className={`${styles.section} ${styles.solutionSection}`}>
            <p className={`${styles.sectionEyebrow} ${styles.eyebrowDiagnostics}`}>{t('aboutSolutionEyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('aboutSolutionTitle')}</h2>
            <p className={styles.sectionBody}>{t('aboutSolutionBody')}</p>
            <figure className={styles.wideFigure}>
              <img className={styles.wideImg} src={asset(MATERIAL_IMG.src)} alt={MATERIAL_IMG.alt} loading="lazy" />
            </figure>
          </Reveal>

          {/* The five problems are an argument, not a record of what we did,
              so they close the mission rather than sitting under activity. */}
          <Reveal as="section" className={`${styles.section} ${styles.findingsSection}`}>
            <h2 className={styles.sectionTitle}>{t('aboutFindingsTitle')}</h2>
            <p className={styles.sectionBody}>{t('aboutFindingsBody')}</p>
          </Reveal>

          {aboutVideo?.url ? (
            <Reveal as="section" className={styles.section}>
              <figure className={styles.videoFigure}>
                <VideoEmbed url={aboutVideo.url} title={aboutVideo.caption[lang] || aboutVideo.caption.en} />
                <figcaption className={styles.videoCaption}>
                  {aboutVideo.caption[lang] || aboutVideo.caption.en}
                </figcaption>
              </figure>
            </Reveal>
          ) : null}

          <Reveal as="footer" className={styles.closing}>
            <p className={styles.closingText}>{t('aboutClosing')}</p>
          </Reveal>
        </div>
      )}

      {tab === 'history' && (
        <div className={styles.tabContent}>
          <Reveal as="section" className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('aboutHistTitle')}</h2>
            <p className={styles.sectionBody}>{t('aboutHistLede')}</p>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <div className={styles.timeline}>
              {TIMELINE.map((n) => (
                <div key={n} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineDate}>{t(`aboutTl${n}Date`)}</p>
                    <h3 className={styles.timelineTitle}>{t(`aboutTl${n}Title`)}</h3>
                    <p className={styles.timelineDesc}>{t(`aboutTl${n}Desc`)}</p>
                    {TL_NEWS[n] && (
                      <a className={styles.timelineLink} href={newsHref(TL_NEWS[n])}>
                        {t('aboutTlReadReport')}
                        <span aria-hidden="true"> →</span>
                      </a>
                    )}
                    {TL_IMAGES[n] && (
                      <div className={styles.timelinePhotos}>
                        {TL_IMAGES[n].map((photo) => (
                          <img
                            key={photo.src}
                            className={`${styles.timelinePhoto} ${photo.portrait ? styles.timelinePhotoPortrait : ''}`}
                            src={asset(photo.src)}
                            alt={photo.alt}
                            loading="lazy"
                            style={photo.focusY ? { objectPosition: `center ${photo.focusY}` } : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <p className={`${styles.sectionEyebrow} ${styles.eyebrowFoundations}`}>{t('aboutRecordEyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('aboutRecordTitle')}</h2>
            <div className={styles.recordGrid}>
              {RECORDS.map((n) => (
                <div key={n} className={styles.recordTile}>
                  <span className={styles.recordValue}>{t(`aboutRecord${n}Value`)}</span>
                  <span className={styles.recordLabel}>{t(`aboutRecord${n}Label`)}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className={styles.section}>
            <p className={`${styles.sectionEyebrow} ${styles.eyebrowPractice}`}>{t('aboutGalleryEyebrow')}</p>
            <h2 className={styles.sectionTitle}>{t('aboutGalleryTitle')}</h2>
            <div className={styles.galleryGrid}>
              {GALLERY.map((photo) => (
                <figure key={photo.src} className={styles.galleryFigure}>
                  <img className={styles.galleryImg} src={asset(photo.src)} alt={photo.alt} loading="lazy" />
                  <figcaption className={styles.galleryCaption}>{t(photo.capKey)}</figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </div>
      )}

      {tab === 'team' && (
        <div className={styles.tabContent}>
          <Reveal as="section" className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('aboutTeamTitle')}</h2>
            <p className={styles.sectionBody}>{t('aboutTeamLede')}</p>
          </Reveal>

          <Reveal as="figure" className={styles.teamFigure}>
            <img className={styles.teamPhoto} src={asset(TEAM_IMG.src)} alt={TEAM_IMG.alt} loading="lazy" />
          </Reveal>

          <Reveal as="section" className={styles.section}>
            {/* Track class sits on the card, so the top rule and the role
                chip both read --track-color from one place. */}
            <div className={styles.teamGrid}>
              {MEMBERS.map((m) => (
                <div key={m.name} className={`${styles.memberCard} ${styles[`track_${m.track}`]}`}>
                  <img className={styles.avatarPhoto} src={asset(m.photo)} alt={m.name} loading="lazy" />
                  <div className={styles.memberInfo}>
                    <p className={styles.memberName}>{m.name}</p>
                    <p className={styles.memberReading}>{m.reading}</p>
                    <p className={styles.memberRole}>{t(`aboutMember${m.key}Role`)}</p>
                    <p className={styles.memberMajor}>{t(m.majorKey)}</p>
                    <p className={styles.memberBio}>{t(`aboutMember${m.key}Bio`)}</p>
                    {m.links && (
                      <p className={styles.memberLinks}>
                        {m.links.map((link) => (
                          <a
                            key={link.url}
                            className={styles.memberLink}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${m.name} — ${socialLabel(link.network)}`}
                            title={socialLabel(link.network)}
                          >
                            <SocialIcon network={link.network} size={18} />
                          </a>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="footer" className={styles.closing}>
            <p className={styles.closingMeta}>{t('aboutMeta')}</p>
            <p className={styles.closingContact}>
              {t('aboutContactLabel')} <ContactEmail />
            </p>
          </Reveal>
        </div>
      )}

      {/* Reaching the end of a tab used to be a dead end — the only way on
          was to scroll back up to the tab bar. This carries the reader
          straight into the next one. */}
      <nav className={styles.pager} aria-label={t('aboutPagerLabel')}>
        {prevTab ? (
          <button type="button" className={styles.pagerLink} onClick={() => goToTab(prevTab)}>
            <span className={styles.pagerDir}>← {t('aboutPagerPrev')}</span>
            <span className={styles.pagerName}>{t(tabLabelKey(prevTab))}</span>
          </button>
        ) : (
          <span />
        )}
        {nextTab && (
          <button
            type="button"
            className={`${styles.pagerLink} ${styles.pagerNext}`}
            onClick={() => goToTab(nextTab)}
          >
            <span className={styles.pagerDir}>{t('aboutPagerNext')} →</span>
            <span className={styles.pagerName}>{t(tabLabelKey(nextTab))}</span>
          </button>
        )}
      </nav>
      </div>
    </>
  )
}

export default AboutPage
