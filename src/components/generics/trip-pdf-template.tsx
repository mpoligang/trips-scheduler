import React from 'react';
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    Link,
} from '@react-pdf/renderer';
import { Trip } from '@/models/Trip';
import { hasRealContent } from '@/utils/fileSizeUtils';

// --- CONFIGURAZIONE STILI ---
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#2D3748',
    },
    header: {
        marginBottom: 25,
        borderBottom: 2,
        borderBottomColor: '#003580',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A365D',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 11,
        color: '#718096',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#003580',
        padding: '5 10',
        marginBottom: 10,
        borderRadius: 2,
    },
    card: {
        marginBottom: 10,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        borderBottomStyle: 'solid',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    label: {
        fontWeight: 'bold',
        color: '#4A5568',
        width: 110,
        fontSize: 9,
    },
    value: {
        flex: 1,
        color: '#2D3748',
        fontSize: 9,
    },
    notes: {
        marginTop: 6,
        padding: 8,
        backgroundColor: '#F7FAFC',
        borderLeftWidth: 2,
        borderLeftColor: '#CBD5E0',
        borderLeftStyle: 'solid',
        fontStyle: 'italic',
        fontSize: 9,
        color: '#4A5568',
    },
    stopoverContainer: {
        marginTop: 8,
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: '#E2E8F0',
        borderLeftStyle: 'solid',
    },
    stopoverTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#718096',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    stopoverItem: {
        marginBottom: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#A0AEC0',
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
        borderTopStyle: 'solid',
        paddingTop: 10,
    }
});

// --- HELPER PER IL CONTENUTO HTML ---
/**
 * Poiché @react-pdf/renderer non supporta HTML, questa funzione pulisce il testo.
 * Sostituisce i tag di blocco e di interruzione con ritorni a capo e rimuove il resto.
 */
const formatHtmlNotes = (html: string | null | undefined): string => {
    if (!html) return "";
    return html
        .replace(/<br\s*\/?>/gi, '\n')           // Sostituisce <br> con invio
        .replace(/<\/p>/gi, '\n')               // Sostituisce fine paragrafo con invio
        .replace(/<li>/gi, '• ')               // Sostituisce <li> con un pallino
        .replace(/<\/li>/gi, '\n')              // Fine elemento lista
        .replace(/<[^>]*>?/gm, '')              // Rimuove tutti i tag rimanenti
        .trim();
};

// --- COMPONENTI ATOMICI ---

const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{value || '-'}</Text>
    </View>
);

// --- TEMPLATE PRINCIPALE ---

const TripPdfTemplate = ({ trip }: { trip: Trip }) => {
    if (!trip) {
        return (
            <Document>
                <Page style={styles.page}>
                    <Text>Caricamento dati del viaggio...</Text>
                </Page>
            </Document>
        );
    }

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Document title={`Itinerario - ${trip.name}`}>
            <Page size="A4" style={styles.page}>

                {/* INTESTAZIONE */}
                <View style={styles.header}>
                    <Text style={styles.title}>{trip.name}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.subtitle}>
                            Dal {formatDate(trip.start_date)} al {formatDate(trip.end_date)}
                        </Text>
                    </View>
                    {trip.destinations && trip.destinations.length > 0 && (
                        <Text style={{ marginTop: 5, fontSize: 9, color: '#4A5568' }}>
                            Destinazioni: {trip.destinations.join(' • ')}
                        </Text>
                    )}
                </View>

                {/* SEZIONE TRASPORTI */}
                {(trip.transports || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>TRASPORTI E SPOSTAMENTI</Text>
                        {(trip.transports || []).map((t) => (
                            <View key={t.id} style={styles.card} wrap={false}>
                                <Text style={styles.cardTitle}>{t.type}: {t.title}</Text>
                                <InfoRow label="Data/Ora Partenza" value={formatDateTime(t.dep_date as string)} />
                                <InfoRow label="Luogo Partenza" value={t.dep_address as string} />
                                {t.destination && <InfoRow label="Arrivo previsto a" value={t.destination as string} />}
                                {t.details?.carrier && <InfoRow label="Compagnia/Vettore" value={t.details.carrier as string} />}
                                {t.details?.booking_reference && (
                                    <InfoRow label="Rif. Prenotazione" value={t.details.booking_reference as string} />
                                )}

                                {t.details?.stopovers && t.details.stopovers.length > 0 && (
                                    <View style={styles.stopoverContainer}>
                                        <Text style={styles.stopoverTitle}>Scali / Fermate Intermedie:</Text>
                                        {t.details.stopovers.map((s) => (
                                            <View key={s.id} style={styles.stopoverItem}>
                                                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>📍 {s.stopover_place}</Text>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text style={{ fontSize: 8, color: '#4A5568' }}>
                                                        Arr: {s.arrival_time} | Part: {s.departure_time}
                                                    </Text>
                                                    <Text style={{ fontSize: 8, color: '#718096', marginLeft: 10 }}>
                                                        Durata: {s.duration}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {hasRealContent(t.notes) && (
                                    <Text style={styles.notes}>
                                        {formatHtmlNotes(t.notes)}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* SEZIONE ALLOGGI */}
                {(trip.accommodations || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ALLOGGI E PERNOTTAMENTI</Text>
                        {(trip.accommodations || []).map((acc) => (
                            <View key={acc.id} style={styles.card} wrap={false}>
                                <Text style={styles.cardTitle}>{acc.name}</Text>
                                <InfoRow label="Check-in" value={formatDate(acc.start_date)} />
                                <InfoRow label="Check-out" value={formatDate(acc.end_date)} />
                                <InfoRow label="Indirizzo" value={acc.address} />
                                {acc.link && (
                                    <Link
                                        src={acc.link}
                                        style={{ color: '#3182CE', fontSize: 9, textDecoration: 'underline', marginTop: 4 }}
                                    >
                                        Visualizza Mappa o Prenotazione
                                    </Link>
                                )}
                                {hasRealContent(acc.notes) && (
                                    <Text style={styles.notes}>
                                        {formatHtmlNotes(acc.notes)}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* SEZIONE ITINERARIO (STAGES) */}
                {(trip.stages || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ITINERARIO GIORNALIERO</Text>
                        {(trip.stages || []).map((stage) => (
                            <View key={stage.id} style={styles.card} wrap={false}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{stage.name}</Text>
                                    <Text style={{ fontSize: 8, color: '#718096' }}>{formatDate(stage.arrival_date)}</Text>
                                </View>
                                {stage.destination && <InfoRow label="Località" value={stage.destination} />}
                                {stage.address && <InfoRow label="Indirizzo" value={stage.address} />}
                                {hasRealContent(stage.notes) && (
                                    <Text style={styles.notes}>
                                        {formatHtmlNotes(stage.notes)}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* PIÈ DI PAGINA */}
                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) => (
                        `Pagina ${pageNumber} di ${totalPages} • Documento generato per ${trip.name}`
                    )}
                    fixed
                />
            </Page>
        </Document>
    );
};

export default TripPdfTemplate;