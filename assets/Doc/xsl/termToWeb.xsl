<?xml version="1.0" encoding="ISO-8859-1"?>

<xsl:transform
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

        xmlns:xs="http://www.w3.org/2001/XMLSchema"
        version="2.0"
>
    <xsl:output method="html"  indent="no"/>

<xsl:param name="topicPath"/>
<xsl:param name="topicNameParam"/>
<xsl:param name="shortFilename"/>
<xsl:param name="dv_vals"/>
<xsl:param name="dv_attr"/>
<xsl:param name="rootHtmlDoc"/>


    <xsl:template match="termentry">
        <xsl:element name="div">
            <xsl:attribute name="class">TermEntry</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>


    <xsl:template match="termentry/title">
        <xsl:element name="h1">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>





    <xsl:template match="definition">
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="partOfSpeech">
        <xsl:element name="div">
            <xsl:attribute name="class">PartOfSpeech</xsl:attribute>
            <xsl:element name="p">Part of Speech: <xsl:value-of select="@value"/></xsl:element>
        </xsl:element>
        <xsl:apply-templates/>
    </xsl:template>


    <xsl:template match="fullForm">

        <xsl:element name="div">
            <xsl:attribute name="class">FullForm_<xsl:value-of select="@usage"/></xsl:attribute>
            <xsl:element name="p">
                <xsl:attribute name="class">usage_p</xsl:attribute>
                <xsl:element name="b"><xsl:value-of select="@usage"/>:
                </xsl:element>
            </xsl:element>
            <xsl:element name="p">LANGUAGE: <xsl:value-of select="@language"/></xsl:element>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>


    <xsl:template match="termVariant">
        <xsl:element name="div">
            <xsl:attribute name="class">termVariant</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>


    <xsl:template match="termBody">
        <xsl:element name="div">
            <xsl:attribute name="class">TermBody</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>


    <xsl:template match="fig/title">
        <xsl:element name="div">
            <xsl:attribute name="class">fig_title</xsl:attribute>
                <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="definitionText">
        <xsl:element name="p">
            <xsl:attribute name="class">definitionText</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>


    <xsl:template match="definitionSource">
        <xsl:element name="div">
            <xsl:attribute name="class">definitionSource</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="sourceReference">
        <xsl:variable name="outputclassStr" select="@outputclass"/>
        <xsl:variable name="hrefStr" select="@href"/>
        <xsl:variable name="externalFunctionStr">
            <xsl:value-of select="$rootHtmlDoc" />#topic=<xsl:value-of select="$topicNameParam"/><xsl:value-of select="@href"/>
        </xsl:variable>
        <xsl:variable name="internalFunctionStr">
            <xsl:value-of select="$rootHtmlDoc" />#topic=<xsl:value-of select="$topicNameParam"/><xsl:value-of select="$shortFilename"/>&amp;hash=<xsl:value-of select="translate(@href, '\#', '')"/>
        </xsl:variable>

        <xsl:element name="div">
        <xsl:attribute name="class">sourceReference</xsl:attribute>
        <xsl:element name="p">Definition Source:
        <xsl:element name="a">
            <xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
            <xsl:choose>
                <xsl:when test="@outputclass = 'InternalUrl'">
                    <xsl:attribute name="href"><xsl:value-of select="@href"/></xsl:attribute>
                </xsl:when>
                <xsl:when test="@outputclass = 'ExternalUrl'">
                    <xsl:attribute name="href"><xsl:value-of select="@href"/></xsl:attribute>
                    <xsl:attribute name="target">_blank</xsl:attribute>
                </xsl:when>
                <xsl:when test="@scope = 'external'">
                    <xsl:attribute name="href"><xsl:value-of select="@href"/></xsl:attribute>
                    <xsl:attribute name="target">_blank</xsl:attribute>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:choose>
                        <xsl:when test="contains($hrefStr, 'xml')">
                            <xsl:attribute name="href"><xsl:value-of select="$externalFunctionStr"/></xsl:attribute>
                            <xsl:attribute name="rootHtmlDoc"><xsl:value-of select="$rootHtmlDoc"/></xsl:attribute>
                            <xsl:attribute name="topicNameParam"><xsl:value-of select="$topicNameParam"/></xsl:attribute>
                            <xsl:attribute name="shortFilename"><xsl:value-of select="$shortFilename"/></xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="href"><xsl:value-of select="$internalFunctionStr"/></xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:otherwise>
            </xsl:choose>
            <xsl:apply-templates/>
        </xsl:element>
        </xsl:element>
        </xsl:element>
    </xsl:template>





    <!-- paragraphs -->
    <xsl:template match="p">
        <!-- To ensure XHTML validity, need to determine whether the DITA kids are block elements.
             If so, use div_class="p" instead of p -->
        <xsl:choose>
            <xsl:when test="descendant::pre or
       descendant::ul or
       descendant::sl or
       descendant::ol or
       descendant::lq or
       descendant::dl or
       descendant::note or
       descendant::lines or
       descendant::fig or
       descendant::table or
       descendant::simpletable">
                <div class="p">
                    <!--
                      <xsl:call-template name="setid"/>
                      <xsl:apply-templates select="." mode="outputContentsWithFlagsAndStyle"/>
                      -->
                    <xsl:apply-templates/>
                </div>
            </xsl:when>
            <xsl:otherwise>
                <p>
                    <xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
                    <xsl:choose>
                        <xsl:when test="ancestor::li">
                            <xsl:attribute name="class">Bullet-Continue</xsl:attribute>
                        </xsl:when>
                    </xsl:choose>
                    <xsl:choose>
                        <xsl:when test="ancestor::note and not(preceding-sibling::*)">
                            <xsl:attribute name="class">Note</xsl:attribute>
                            <b>NOTE: </b>
                        </xsl:when>
                    </xsl:choose>
                    <!--
                      <xsl:call-template name="setid"/>
                      <xsl:apply-templates select="." mode="outputContentsWithFlagsAndStyle"/>
                         <xsl:copy-of select="."/>
                      <xsl:value-of select="."/>
                      -->
                    <!--
                       <xsl:apply-templates mode="do_text"/>
                       -->
                    <xsl:apply-templates/>
                </p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>







    <!-- ======================================== -->
    <!-- Text Ranges... -->


    <xsl:template match="b">
        <xsl:element name="b">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="i">
        <xsl:element name="i">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="codeph">
        <xsl:element name="code">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>



    <!-- ================================================== -->
    <!-- Images and other objects... -->



    <xsl:template match="image">
        <xsl:variable name="temp"><xsl:value-of select="@href"/></xsl:variable>
        <xsl:element name="img">
            <xsl:attribute name="alt">image</xsl:attribute>
            <xsl:attribute name="height"><xsl:value-of select="@height"/></xsl:attribute>
            <xsl:attribute name="width"><xsl:value-of select="@width"/></xsl:attribute>
            <xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
            <xsl:choose> <!-- Handle refs to graphics from the SVN dir struct, compared to refs from the client HTML shell file -->
                <xsl:when test="starts-with($temp,'../')">
                    <xsl:attribute name="src">assets/Doc/<xsl:value-of select="substring-after($temp, '../')"/></xsl:attribute>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:attribute name="src"><xsl:value-of select="$temp"/></xsl:attribute>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:element>
    </xsl:template>




    <!-- First CHOOSE deletes the given condition. OTHERWISE gets any text out. -->
    <!--
-->
<xsl:template match="text()">
  <xsl:choose>
	  <xsl:when test="((preceding-sibling::processing-instruction()[1]) and (starts-with(preceding-sibling::processing-instruction('Fm')[1], 'Condstart')))">
		  <xsl:variable name="condName">
		  	<xsl:value-of select="normalize-space(substring-after(preceding-sibling::processing-instruction('Fm')[1], 'Condstart'))" />
		  </xsl:variable>
		  <xsl:if test="$condName != 'Deleted' and $condName != 'PrintOnly' and $condName != 'Hidden' "><xsl:value-of select="." /></xsl:if>
	  </xsl:when>
	  <xsl:otherwise>
	  	<xsl:value-of select="." />
	  </xsl:otherwise>
  </xsl:choose>
</xsl:template>








</xsl:transform>