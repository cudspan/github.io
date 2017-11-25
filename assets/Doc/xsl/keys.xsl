<?xml version="1.0" encoding="ISO-8859-1"?>

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="text"  indent="no"/>

    <xsl:strip-space elements="*"/>


    <xsl:template match="/"><xsl:apply-templates  select="*"/></xsl:template>
    <xsl:template match="map">{"kDataArray": [<xsl:for-each select="keydef">{ "name" : "<xsl:value-of select="@keys"/>", <xsl:apply-templates/> }<xsl:choose><xsl:when test="position() != last()">,</xsl:when></xsl:choose></xsl:for-each> ]}</xsl:template>
    <xsl:template match="topicmeta/keywords/keyword"> "val": <xsl:text>"</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text></xsl:template>
</xsl:stylesheet>
