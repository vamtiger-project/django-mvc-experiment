from django.conf.urls import patterns, include, url
from django.contrib import admin

from GigGuide.gigGuide import GigInfo

gigInfo = GigInfo()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'JameForbes.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^gigAdmin/', include(admin.site.urls)),
    url(r'^gigManager/', gigInfo.manager),
    url(r'^loadGigInfo/', gigInfo.load),
    url(r"^requestGigViewerDataListOptions/", gigInfo.gigViewerDataListOptions),
    url(r"^saveGigInfo/", gigInfo.save),
    url(r"^requestGigsToPublish/", gigInfo.requestGigsToPublish),
    url(r"^publishWebPage/", gigInfo.publishWebPage),
    url(r"^requestGigYears/", gigInfo.requestGigYears),
    url(r"^exportGigInfoToExcelFormat/", gigInfo.exportGigInfoToExcelFormat),
    url(r"^openExportedExcelFiles/", gigInfo.openExportedExcelFiles),
)