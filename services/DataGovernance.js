/**
 * Data Governance Layer - SQLite-based
 * Manages metadata, lineage, versioning for production-scale data operations
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DataGovernance {
  constructor(dbPath = null) {
    // Create data directory if it doesn't exist
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = dbPath || join(dataDir, 'governance.db');
    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Metadata table - tracks data sources, schemas, quality metrics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        city_id INTEGER,
        domain TEXT NOT NULL,
        schema_version TEXT,
        data_source TEXT,
        quality_score REAL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attributes TEXT,
        UNIQUE(entity_type, entity_id, city_id, domain)
      )
    `);

    // Lineage table - tracks data flow and transformations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS lineage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_entity_type TEXT NOT NULL,
        source_entity_id TEXT NOT NULL,
        target_entity_type TEXT NOT NULL,
        target_entity_id TEXT NOT NULL,
        transformation TEXT,
        lag_hours INTEGER DEFAULT 0,
        correlation_score REAL,
        confidence REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // Versioning table - tracks data versions and snapshots
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        city_id INTEGER,
        version INTEGER NOT NULL,
        snapshot_data TEXT,
        checksum TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT DEFAULT 'system'
      )
    `);

    // Cross-domain links - explicit connections between domains
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cross_domain_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_domain TEXT NOT NULL,
        source_metric TEXT NOT NULL,
        target_domain TEXT NOT NULL,
        target_metric TEXT NOT NULL,
        lag_hours INTEGER DEFAULT 0,
        correlation REAL,
        causal_confidence REAL,
        validation_status TEXT DEFAULT 'pending',
        domain_logic TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System resilience metrics - aggregated cross-domain health
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS resilience_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        urban_health_score REAL,
        health_health_score REAL,
        agriculture_health_score REAL,
        systemic_resilience REAL,
        cross_domain_risk REAL,
        metadata TEXT
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_metadata_lookup ON metadata(city_id, domain);
      CREATE INDEX IF NOT EXISTS idx_lineage_source ON lineage(source_entity_type, source_entity_id);
      CREATE INDEX IF NOT EXISTS idx_lineage_target ON lineage(target_entity_type, target_entity_id);
      CREATE INDEX IF NOT EXISTS idx_versions_entity ON versions(entity_type, entity_id, city_id);
      CREATE INDEX IF NOT EXISTS idx_cross_domain ON cross_domain_links(source_domain, target_domain);
      CREATE INDEX IF NOT EXISTS idx_resilience_city ON resilience_metrics(city_id, timestamp);
    `);
  }

  /**
   * Register metadata for a data entity
   */
  registerMetadata(entityType, entityId, cityId, domain, metadata) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO metadata 
      (entity_type, entity_id, city_id, domain, schema_version, data_source, quality_score, attributes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entityType,
      entityId,
      cityId,
      domain,
      metadata.schemaVersion || '1.0',
      metadata.dataSource || 'unknown',
      metadata.qualityScore || 1.0,
      JSON.stringify(metadata.attributes || {})
    );
  }

  /**
   * Record data lineage (data flow relationships)
   */
  recordLineage(source, target, transformation, lagHours = 0, correlation = null, confidence = null) {
    const stmt = this.db.prepare(`
      INSERT INTO lineage 
      (source_entity_type, source_entity_id, target_entity_type, target_entity_id, 
       transformation, lag_hours, correlation_score, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      source.type,
      source.id,
      target.type,
      target.id,
      transformation || 'direct',
      lagHours,
      correlation,
      confidence
    );
  }

  /**
   * Create version snapshot
   */
  createVersion(entityType, entityId, cityId, snapshotData) {
    const getVersionStmt = this.db.prepare(`
      SELECT MAX(version) as max_version FROM versions 
      WHERE entity_type = ? AND entity_id = ? AND city_id = ?
    `);
    
    const result = getVersionStmt.get(entityType, entityId, cityId);
    const nextVersion = (result?.max_version || 0) + 1;

    // Simple checksum
    const checksum = this.calculateChecksum(JSON.stringify(snapshotData));

    const stmt = this.db.prepare(`
      INSERT INTO versions 
      (entity_type, entity_id, city_id, version, snapshot_data, checksum)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entityType,
      entityId,
      cityId,
      nextVersion,
      JSON.stringify(snapshotData),
      checksum
    );

    return nextVersion;
  }

  /**
   * Register cross-domain causal link
   */
  registerCrossDomainLink(sourceDomain, sourceMetric, targetDomain, targetMetric, 
                          lagHours, correlation, causalConfidence, domainLogic) {
    const stmt = this.db.prepare(`
      INSERT INTO cross_domain_links 
      (source_domain, source_metric, target_domain, target_metric, 
       lag_hours, correlation, causal_confidence, domain_logic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sourceDomain,
      sourceMetric,
      targetDomain,
      targetMetric,
      lagHours,
      correlation,
      causalConfidence,
      domainLogic
    );
  }

  /**
   * Calculate systemic resilience metrics
   */
  calculateSystemicResilience(cityId, urbanScore, healthScore, agricultureScore) {
    // Cross-domain risk assessment
    const crossDomainRisk = this.assessCrossDomainRisk(cityId);
    
    // Weighted systemic resilience (not just sum of parts)
    const systemicResilience = (
      urbanScore * 0.35 +
      healthScore * 0.35 +
      agricultureScore * 0.30
    ) - (crossDomainRisk * 0.2); // Penalize cross-domain vulnerabilities

    const stmt = this.db.prepare(`
      INSERT INTO resilience_metrics 
      (city_id, urban_health_score, health_health_score, agriculture_health_score, 
       systemic_resilience, cross_domain_risk)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      cityId,
      urbanScore,
      healthScore,
      agricultureScore,
      Math.max(0, Math.min(1, systemicResilience)),
      crossDomainRisk
    );

    return {
      urbanScore,
      healthScore,
      agricultureScore,
      systemicResilience: Math.max(0, Math.min(1, systemicResilience)),
      crossDomainRisk
    };
  }

  /**
   * Assess cross-domain risk based on causal links
   */
  assessCrossDomainRisk(cityId) {
    // Get all cross-domain links with high risk indicators
    const stmt = this.db.prepare(`
      SELECT AVG(causal_confidence * (1 - ABS(correlation))) as risk_score
      FROM cross_domain_links
      WHERE validation_status = 'validated'
    `);

    const result = stmt.get();
    return result?.risk_score || 0;
  }

  /**
   * Get causal discovery results (lagged correlations)
   */
  getCausalLinks(sourceDomain = null, targetDomain = null) {
    let query = 'SELECT * FROM cross_domain_links WHERE 1=1';
    const params = [];

    if (sourceDomain) {
      query += ' AND source_domain = ?';
      params.push(sourceDomain);
    }

    if (targetDomain) {
      query += ' AND target_domain = ?';
      params.push(targetDomain);
    }

    query += ' ORDER BY causal_confidence DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get systemic resilience for a city
   */
  getSystemicResilience(cityId, hours = 24) {
    const stmt = this.db.prepare(`
      SELECT * FROM resilience_metrics 
      WHERE city_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    return stmt.all(cityId, hours);
  }

  /**
   * Get data lineage for an entity
   */
  getLineage(entityType, entityId, direction = 'both') {
    let query;
    if (direction === 'source' || direction === 'both') {
      query = 'SELECT * FROM lineage WHERE source_entity_type = ? AND source_entity_id = ?';
      const stmt = this.db.prepare(query);
      return stmt.all(entityType, entityId);
    } else {
      query = 'SELECT * FROM lineage WHERE target_entity_type = ? AND target_entity_id = ?';
      const stmt = this.db.prepare(query);
      return stmt.all(entityType, entityId);
    }
  }

  calculateChecksum(data) {
    // Simple hash for checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  close() {
    this.db.close();
  }
}
